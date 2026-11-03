import { skillById } from '@mathapp/content';
import { SkillIcon } from '../game/art';
import { useGame } from '../game/GameProvider';
import { BigButton } from '../ui/BigButton';
import { Icon } from '../ui/icons';
import { MyMascot } from '../ui/MyMascot';

/**
 * A badge is the biggest thing a child can earn, so it gets the whole screen for a moment,
 * before the celebration. It's already on the trophy wall; this just makes sure it's seen.
 */
export function BadgeReveal() {
  const { actions, use } = useGame();
  const id = use((s) => s.badgeShow[0]);
  const left = use((s) => s.badgeShow.length);
  const skill = id ? skillById(id) : undefined;
  if (!id || !skill) return null;
  return (
    <div
      role="dialog"
      aria-label="new badge"
      data-testid="badge-reveal"
      data-skill={id}
      className="screen fixed inset-0 z-20 items-center justify-center gap-4 overflow-y-auto bg-cream text-center"
    >
      <p className="section-label">New badge!</p>
      <div className="pop relative flex h-44 w-44 items-center justify-center rounded-full border-4 border-ink bg-sun map-glow">
        <span className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-ink bg-white">
          <SkillIcon id={id} size={88} />
        </span>
        <span className="absolute -bottom-3 -left-2">
          <Icon name="star" size={44} />
        </span>
        <span className="absolute -top-2 -right-3">
          <Icon name="trophy" size={48} />
        </span>
      </div>
      <h1 className="text-4xl leading-tight font-black">{skill.badgeName}</h1>
      <p className="max-w-sm text-lg font-bold text-ink-soft">
        You got really good at {skill.kidName}. It's on your trophy wall now!
      </p>
      <MyMascot mood="cheer" size={96} />
      <BigButton
        label={left > 1 ? 'Next badge' : 'Yay!'}
        aria-label="next"
        icon="arrow"
        iconAfter
        className="w-full max-w-md"
        onClick={actions.closeBadge}
      />
    </div>
  );
}
