import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, IsNull, Repository } from 'typeorm';
import { ERROR_MESSAGES } from '../../common/constants';
import { MembershipRole, Role, TaskPriority, TaskStatus } from '../../common/enums';
import { Group, GroupMembership, Task, User } from '../../entities';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupMembership)
    private readonly membershipRepository: Repository<GroupMembership>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(userId: string, query: QueryTasksDto) {
    const { group_id, status, assignee_id, search, page = 1, limit = 20 } =
      query;

    if (group_id) {
      await this.assertGroupExists(group_id);
      await this.assertCanViewGroup(group_id, userId);
    }

    const qb = this.taskRepository
      .createQueryBuilder('task')
      .innerJoin('task.group', 'group')
      .innerJoin(
        'group.members',
        'viewerMembership',
        'viewerMembership.user_id = :userId AND viewerMembership.left_at IS NULL',
        { userId },
      )
      .leftJoin('task.assignee', 'assignee')
      .where('task.deleted_at IS NULL');

    if (group_id) {
      qb.andWhere('task.group_id = :groupId', { groupId: group_id });
    }
    if (status) {
      qb.andWhere('task.status = :status', { status });
    }
    if (assignee_id) {
      qb.andWhere('task.assignee_id = :assigneeId', { assigneeId: assignee_id });
    }
    if (search) {
      qb.andWhere(
        new Brackets((searchQb) => {
          searchQb
            .where('LOWER(task.title) LIKE LOWER(:search)', {
              search: `%${search}%`,
            })
            .orWhere('LOWER(COALESCE(task.description, \'\')) LIKE LOWER(:search)', {
              search: `%${search}%`,
            });
        }),
      );
    }

    qb
      .select([
        'task.id',
        'task.group_id',
        'task.title',
        'task.description',
        'task.status',
        'task.priority',
        'task.due_at',
        'task.created_at',
        'task.updated_at',
        'assignee.id',
        'assignee.full_name',
        'assignee.email',
      ])
      .orderBy('task.updated_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [tasks, total] = await qb.getManyAndCount();

    return {
      data: tasks.map((task) => this.toTaskResponse(task)),
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async create(userId: string, userRole: Role, dto: CreateTaskDto) {
    await this.assertGroupExists(dto.group_id);
    await this.assertCanManageGroup(dto.group_id, userId, userRole);
    await this.assertAssigneeInGroup(dto.group_id, dto.assignee_id);

    const task = this.taskRepository.create({
      group_id: dto.group_id,
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      status: dto.status || TaskStatus.TODO,
      priority: dto.priority || TaskPriority.MEDIUM,
      assignee_id: dto.assignee_id || null,
      due_at: dto.due_at ? new Date(dto.due_at) : null,
      created_by_id: userId,
    });

    const savedTask = await this.taskRepository.save(task);
    this.logTaskAction('create', userId, dto.group_id, savedTask.id);
    return this.getTaskForViewer(savedTask.id, userId);
  }

  async update(taskId: string, userId: string, userRole: Role, dto: UpdateTaskDto) {
    const task = await this.getTaskOrThrow(taskId);
    await this.assertCanViewGroup(task.group_id, userId);
    await this.assertCanManageGroup(task.group_id, userId, userRole);

    if (dto.group_id && dto.group_id !== task.group_id) {
      throw new BadRequestException('Changing task group is not supported.');
    }

    if (dto.assignee_id !== undefined) {
      await this.assertAssigneeInGroup(task.group_id, dto.assignee_id);
    }

    Object.assign(task, {
      title: dto.title !== undefined ? dto.title.trim() : task.title,
      description:
        dto.description !== undefined ? dto.description?.trim() || null : task.description,
      status: dto.status ?? task.status,
      priority: dto.priority ?? task.priority,
      assignee_id:
        dto.assignee_id !== undefined ? dto.assignee_id || null : task.assignee_id,
      due_at: dto.due_at !== undefined ? (dto.due_at ? new Date(dto.due_at) : null) : task.due_at,
    });

    await this.taskRepository.save(task);
    this.logTaskAction('update', userId, task.group_id, task.id);
    return this.getTaskForViewer(task.id, userId);
  }

  async remove(taskId: string, userId: string, userRole: Role) {
    const task = await this.getTaskOrThrow(taskId);
    await this.assertCanViewGroup(task.group_id, userId);
    await this.assertCanManageGroup(task.group_id, userId, userRole);

    task.deleted_at = new Date();
    await this.taskRepository.save(task);
    this.logTaskAction('delete', userId, task.group_id, task.id);
  }

  private async getTaskForViewer(taskId: string, userId: string) {
    const task = await this.taskRepository
      .createQueryBuilder('task')
      .innerJoin('task.group', 'group')
      .innerJoin(
        'group.members',
        'viewerMembership',
        'viewerMembership.user_id = :userId AND viewerMembership.left_at IS NULL',
        { userId },
      )
      .leftJoinAndSelect('task.assignee', 'assignee')
      .where('task.id = :taskId', { taskId })
      .andWhere('task.deleted_at IS NULL')
      .getOne();

    if (!task) {
      throw new NotFoundException(ERROR_MESSAGES.TASKS.NOT_FOUND);
    }

    return this.toTaskResponse(task);
  }

  private toTaskResponse(task: Task) {
    return {
      id: task.id,
      key: null,
      group_id: task.group_id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignee_name: task.assignee?.full_name || task.assignee?.email || null,
      due_at: task.due_at,
      created_at: task.created_at,
      updated_at: task.updated_at,
    };
  }

  private async getTaskOrThrow(taskId: string) {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, deleted_at: IsNull() },
    });
    if (!task) {
      throw new NotFoundException(ERROR_MESSAGES.TASKS.NOT_FOUND);
    }
    return task;
  }

  private async assertGroupExists(groupId: string) {
    const group = await this.groupRepository.findOne({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException(ERROR_MESSAGES.TASKS.GROUP_NOT_FOUND);
    }
    return group;
  }

  private async assertCanViewGroup(groupId: string, userId: string) {
    const membership = await this.membershipRepository.findOne({
      where: { group_id: groupId, user_id: userId, left_at: IsNull() },
    });

    if (!membership) {
      throw new ForbiddenException(ERROR_MESSAGES.TASKS.FORBIDDEN_READ);
    }

    return membership;
  }

  private async assertCanManageGroup(groupId: string, userId: string, userRole: Role) {
    if (userRole === Role.ADMIN) {
      return;
    }

    const membership = await this.membershipRepository.findOne({
      where: { group_id: groupId, user_id: userId, left_at: IsNull() },
    });

    if (!membership || membership.role_in_group !== MembershipRole.LEADER) {
      throw new ForbiddenException(ERROR_MESSAGES.TASKS.FORBIDDEN_WRITE);
    }
  }

  private async assertAssigneeInGroup(groupId: string, assigneeId?: string | null) {
    if (!assigneeId) {
      return;
    }

    const membership = await this.membershipRepository.findOne({
      where: { group_id: groupId, user_id: assigneeId, left_at: IsNull() },
    });

    if (!membership) {
      throw new BadRequestException(ERROR_MESSAGES.TASKS.ASSIGNEE_NOT_IN_GROUP);
    }

    const user = await this.userRepository.findOne({ where: { id: assigneeId } });
    if (!user) {
      throw new BadRequestException(ERROR_MESSAGES.TASKS.ASSIGNEE_NOT_IN_GROUP);
    }
  }

  private logTaskAction(
    action: 'create' | 'update' | 'delete',
    actorUserId: string,
    groupId: string,
    taskId: string,
  ) {
    this.logger.log(
      JSON.stringify({
        event: 'task_write',
        action,
        actor_user_id: actorUserId,
        group_id: groupId,
        task_id: taskId,
      }),
    );
  }
}
