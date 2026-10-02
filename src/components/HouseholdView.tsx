import { useState } from 'preact/hooks';
import { Check, Download, HardDrive, Leaf, Users } from 'lucide-preact';
import type { HouseholdState } from '../data/stock';

interface HouseholdViewProps {
  household: string;
  people: number;
  state: HouseholdState;
  onSave: (name: string, people: number) => void;
}

export default function HouseholdView({ household, people, state, onSave }: HouseholdViewProps) {
  const [name, setName] = useState(household);
  const [count, setCount] = useState(people);
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'frigomalin-sauvegarde.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div class="household-view">
      <div class="page-heading">
        <div>
          <span class="eyebrow">Une cuisine, de bonnes habitudes</span>
          <h1 tabIndex={-1}>Mon foyer</h1>
        </div>
        <Users size={32} class="heading-icon" />
      </div>
      <section class="household-profile">
        <img src={`${import.meta.env.BASE_URL}images/recipes-1.png`} alt="" />
        <div>
          <h2>{household}</h2>
          <p>{people} personnes à table</p>
          <span class="badge fresh">
            <Leaf size={13} /> Chaque aliment compte
          </span>
        </div>
      </section>
      <form
        class="household-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(name.trim() || 'Mon foyer', count);
        }}
      >
        <label for="household-name">Nom du foyer</label>
        <input
          id="household-name"
          required
          maxLength={60}
          value={name}
          onInput={(event) => setName(event.currentTarget.value)}
        />
        <label for="household-count">Nombre de personnes</label>
        <input
          id="household-count"
          type="number"
          min="1"
          max="12"
          required
          value={count}
          onInput={(event) => setCount(Number(event.currentTarget.value))}
        />
        <button class="button primary" type="submit">
          <Check size={18} /> Enregistrer le foyer
        </button>
      </form>
      <section class="local-data-section">
        <HardDrive size={28} />
        <h2>Vos données, chez vous</h2>
        <p>
          Votre stock est conservé dans ce navigateur, sans compte ni synchronisation. Effacer les
          données du navigateur effacera aussi votre stock.
        </p>
        <button class="button subtle" onClick={download}>
          <Download size={18} /> Exporter mes données
        </button>
      </section>
    </div>
  );
}
