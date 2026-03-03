import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IntegrationToken, ProjectLink } from '../../entities';
import { JiraService } from './jira.service';

describe('JiraService', () => {
  let service: JiraService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JiraService,
        { provide: getRepositoryToken(IntegrationToken), useValue: {} },
        { provide: getRepositoryToken(ProjectLink), useValue: {} },
        { provide: HttpService, useValue: {} },
      ],
    }).compile();

    service = module.get<JiraService>(JiraService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
