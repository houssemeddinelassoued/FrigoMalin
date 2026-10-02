import { CookingPot, Leaf, Refrigerator, ScanLine, Users } from 'lucide-preact';

export type View = 'stock' | 'recipes' | 'scanner' | 'impact' | 'household';
interface NavigationProps {
  view: View;
}

export default function Navigation({ view }: NavigationProps) {
  const links = [
    { view: 'stock', label: 'Stock', icon: Refrigerator },
    { view: 'recipes', label: 'Recettes', icon: CookingPot },
    { view: 'scanner', label: 'Ajouter un aliment', icon: ScanLine },
    { view: 'impact', label: 'Impact', icon: Leaf },
    { view: 'household', label: 'Foyer', icon: Users },
  ];
  return (
    <nav class="navigation" aria-label="Navigation principale">
      <a class="rail-brand" href="#/stock">
        <Refrigerator size={30} />
        <span>
          FrigoMalin<small>Chaque aliment compte.</small>
        </span>
      </a>
      <div class="nav-links">
        {links.map(({ view: target, label, icon: Icon }) => (
          <a
            key={target}
            href={`#/${target}`}
            aria-label={label}
            aria-current={view === target ? 'page' : undefined}
            class={`nav-link ${target === 'scanner' ? 'scan-link' : ''}`}
            title={label}
          >
            <Icon size={target === 'scanner' ? 30 : 23} strokeWidth={1.8} />
            <span>{target === 'scanner' ? 'Ajouter' : label}</span>
          </a>
        ))}
      </div>
      <div class="rail-footer">
        <Leaf size={22} />
        <p>
          Moins de gaspillage.
          <br />
          <strong>Plus de plaisir à table.</strong>
        </p>
        <span>Votre stock reste sur cet appareil</span>
      </div>
    </nav>
  );
}
