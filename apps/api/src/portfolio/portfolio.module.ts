import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUser } from '../auth/entities/admin-user.entity';
import { Profile } from '../profile/entities/profile.entity';
import { ClientLogo } from '../client-logos/entities/client-logo.entity';
import { Experience } from '../experiences/entities/experience.entity';
import { Project } from '../projects/entities/project.entity';
import { Study } from '../studies/entities/study.entity';
import { Service } from '../services/entities/service.entity';
import { Strength } from '../strengths/entities/strength.entity';
import { WorkStyleItem } from '../work-style-items/entities/work-style-item.entity';
import { Faq } from '../faqs/entities/faq.entity';
import { Testimonial } from '../testimonials/entities/testimonial.entity';
import { Post } from '../posts/entities/post.entity';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { SingleOwnerService } from '../common/single-owner.service';
import { ProfileService } from '../profile/profile.service';
import { TranslationsService } from '../profile/translations.service';
import { ClientLogosService } from '../client-logos/client-logos.service';
import { ExperiencesService } from '../experiences/experiences.service';
import { ProjectsService } from '../projects/projects.service';
import { StudiesService } from '../studies/studies.service';
import { ServicesService } from '../services/services.service';
import { StrengthsService } from '../strengths/strengths.service';
import { WorkStyleItemsService } from '../work-style-items/work-style-items.service';
import { FaqsService } from '../faqs/faqs.service';
import { TestimonialsService } from '../testimonials/testimonials.service';
import { PostsService } from '../posts/posts.service';

/**
 * Public aggregate read (spec §10.7, §12). Re-provides the existing admin
 * services against their own repositories rather than depending on their
 * modules' exports (none export their service — same pattern `ProjectsModule`
 * already uses for `Experience`), so this module owns its own
 * `TypeOrmModule.forFeature` registration for every entity it aggregates.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminUser,
      Profile,
      ClientLogo,
      Experience,
      Project,
      Study,
      Service,
      Strength,
      WorkStyleItem,
      Faq,
      Testimonial,
      Post,
    ]),
  ],
  controllers: [PortfolioController],
  providers: [
    PortfolioService,
    SingleOwnerService,
    ProfileService,
    TranslationsService,
    ClientLogosService,
    ExperiencesService,
    ProjectsService,
    StudiesService,
    ServicesService,
    StrengthsService,
    WorkStyleItemsService,
    FaqsService,
    TestimonialsService,
    PostsService,
  ],
})
export class PortfolioModule {}
