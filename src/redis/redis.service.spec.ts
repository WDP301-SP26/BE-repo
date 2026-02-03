describe('RedisService', () => {
  let service: RedisService;

  it('should store and retrieve OAuth state', async () => {
    const state = 'test-state-123';
    const redirectUri = 'http://localhost:3000';

    await service.setOAuthState(state, redirectUri);
    const result = await service.getOAuthState(state);

    expect(result).toBe(redirectUri);
  });

  it('should return null for expired/missing state', async () => {
    const result = await service.getOAuthState('non-existent');
    expect(result).toBeNull();
  });
});
