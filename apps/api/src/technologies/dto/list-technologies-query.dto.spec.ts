import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListTechnologiesQueryDto } from './list-technologies-query.dto';

describe('ListTechnologiesQueryDto', () => {
  it('applies defaults and normalizes category/search', async () => {
    const query = plainToInstance(ListTechnologiesQueryDto, {
      category: '  Backend-Frameworks ',
      search: '  TypeScript  ',
      featured: 'false',
    });

    await expect(validate(query)).resolves.toHaveLength(0);
    expect(query).toMatchObject({
      page: 1,
      limit: 50,
      category: 'backend-frameworks',
      search: 'TypeScript',
      featured: false,
    });
  });

  it.each([
    { page: '0' },
    { page: '1.5' },
    { limit: '51' },
    { featured: '1' },
    { category: 'not a slug' },
    { search: ' x ' },
  ])('rejects invalid values: %p', async (input) => {
    const query = plainToInstance(ListTechnologiesQueryDto, input);

    expect(await validate(query)).not.toHaveLength(0);
  });
});
