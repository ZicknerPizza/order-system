import { Component, input } from '@angular/core';
import { Imprint as ImprintData } from '../api/models';
import { GeneralTabs } from './general-tabs';

/**
 * Describes what this system actually stores. Keep it in line with the code when the stored data
 * or the hosting changes. The person responsible is the provider from the imprint configuration.
 */
@Component({
  imports: [GeneralTabs],
  template: `
    <app-general-tabs active="privacy" />
    <h2>Datenschutzerklärung</h2>

    <h3>1. Verantwortlicher</h3>
    @if (imprint(); as imprint) {
      <p>
        {{ imprint.name }}<br />
        @for (line of imprint.address; track $index) {
          {{ line }}<br />
        }
        @if (imprint.email) {
          E-Mail: {{ imprint.email }}
        }
      </p>
    } @else {
      <div class="alert alert-warning">
        Die Angaben zum Verantwortlichen sind noch nicht hinterlegt.
      </div>
    }

    <h3>2. Hosting und Server-Logs</h3>
    <p>
      Diese Website liegt bei ALL-INKL.COM – Neue Medien Münnich in Friedersdorf, Deutschland. Bei
      jedem Aufruf speichert der Server automatisch: IP-Adresse, Datum und Uhrzeit, aufgerufene
      Adresse, übertragene Datenmenge, Browser und Betriebssystem sowie die zuvor besuchte Seite.
      Diese Daten brauchen wir für den sicheren Betrieb der Website (Art. 6 Abs. 1 lit. f DSGVO).
      Sie werden nach 7 Tagen gelöscht. Der Hoster verarbeitet die Daten in unserem Auftrag (Art. 28
      DSGVO).
    </p>

    <h3>3. Pizza-Bestellungen</h3>
    <p>
      Wenn du eine Pizza bestellst, speichern wir den angegebenen Namen, die gewählten Zutaten,
      deinen Kommentar und die Zeitpunkte, zu denen die Pizza belegt und gebacken wird. Wir nutzen
      diese Angaben, um deine Pizza zu backen und dir zuzuordnen. Sehen können sie nur die Gastgeber
      und das Küchenteam. Die Bestellung ist freiwillig, ein Spitzname genügt (Art. 6 Abs. 1 lit. a
      DSGVO).
    </p>
    <p>
      Angaben zu Unverträglichkeiten im Kommentar machst du freiwillig und ausdrücklich, damit wir
      sie bei der Zubereitung berücksichtigen (Art. 9 Abs. 2 lit. a DSGVO).
    </p>
    <p>
      Die Bestellungen bleiben nach der Feier gespeichert. Wir werten sie ohne Bezug zu einzelnen
      Personen aus, um für künftige Feiern die Mengen der Zutaten besser zu planen. Auf Wunsch
      löschen wir deinen Namen und deinen Kommentar.
    </p>

    <h3>4. Anmeldung für das Küchenteam</h3>
    <p>
      Wer sich als Gastgeber anmeldet, dessen Anmeldedaten speichert der Browser im lokalen Speicher
      (Local Storage), bis er sich wieder abmeldet. Das ist für die Anmeldung technisch nötig (§ 25
      Abs. 2 Nr. 2 TDDDG). Cookies setzen wir nicht.
    </p>

    <h3>5. Keine Weitergabe und kein Tracking</h3>
    <p>
      Wir geben keine Daten an Dritte weiter, verwenden keine Analyse- oder Werbedienste und laden
      keine Inhalte von fremden Servern.
    </p>

    <h3>6. Deine Rechte</h3>
    <p>
      Du hast das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17),
      Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art.
      21). Eine Einwilligung kannst du jederzeit für die Zukunft widerrufen (Art. 7 Abs. 3). Schreib
      uns dazu einfach eine E-Mail. Außerdem kannst du dich bei einer Datenschutz-Aufsichtsbehörde
      beschweren (Art. 77 DSGVO).
    </p>

    <p class="text-muted">Stand: November 2026</p>
  `,
  styles: `
    h3 {
      margin-top: 20px;
    }
  `,
})
export class Privacy {
  readonly imprint = input.required<ImprintData | null>();
}
