/**
 * Revision cards are generated from the same Ghana curriculum units used by
 * the teacher dashboard and the parent-controlled tutor. No random content.
 */
import { GhanaCurriculumService } from '../services/GhanaCurriculumService';
import { ClassroomService } from '../services/ClassroomService';

export const buildRevisionCards = () => GhanaCurriculumService.getSubjects()
  .flatMap((subject) => GhanaCurriculumService.getSubjectContent(subject)
    .filter((unit) => unit?.id && unit?.title)
    .map((unit) => ({
      id: `curriculum-${unit.id}`,
      subject,
      topic: unit.title,
      prompt: `What do you remember about ${unit.title}?`,
      answer: unit.content || '',
      level: unit.level,
      path: ClassroomService.getActivityPath(unit.lesson),
    })));

export default buildRevisionCards;
