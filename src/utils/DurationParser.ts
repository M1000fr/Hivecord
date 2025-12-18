export class DurationParser {
	private static readonly UNITS: Record<string, number> = {
		// Seconds
		s: 1000,
		sec: 1000,
		secs: 1000,
		second: 1000,
		seconds: 1000,
		seconde: 1000,
		secondes: 1000,

		// Minutes
		m: 60 * 1000,
		min: 60 * 1000,
		mins: 60 * 1000,
		minute: 60 * 1000,
		minutes: 60 * 1000,

		// Hours
		h: 60 * 60 * 1000,
		hour: 60 * 60 * 1000,
		hours: 60 * 60 * 1000,
		heure: 60 * 60 * 1000,
		heures: 60 * 60 * 1000,

		// Days
		d: 24 * 60 * 60 * 1000,
		day: 24 * 60 * 60 * 1000,
		days: 24 * 60 * 60 * 1000,
		j: 24 * 60 * 60 * 1000,
		jour: 24 * 60 * 60 * 1000,
		jours: 24 * 60 * 60 * 1000,

		// Weeks
		w: 7 * 24 * 60 * 60 * 1000,
		week: 7 * 24 * 60 * 60 * 1000,
		weeks: 7 * 24 * 60 * 60 * 1000,
		semaine: 7 * 24 * 60 * 60 * 1000,
		semaines: 7 * 24 * 60 * 60 * 1000,

		// Months (30 days)
		M: 30 * 24 * 60 * 60 * 1000,
		mo: 30 * 24 * 60 * 60 * 1000,
		month: 30 * 24 * 60 * 60 * 1000,
		months: 30 * 24 * 60 * 60 * 1000,
		mois: 30 * 24 * 60 * 60 * 1000,

		// Years (365 days)
		y: 365 * 24 * 60 * 60 * 1000,
		year: 365 * 24 * 60 * 60 * 1000,
		years: 365 * 24 * 60 * 60 * 1000,
		a: 365 * 24 * 60 * 60 * 1000,
		an: 365 * 24 * 60 * 60 * 1000,
		ans: 365 * 24 * 60 * 60 * 1000,
		année: 365 * 24 * 60 * 60 * 1000,
		années: 365 * 24 * 60 * 60 * 1000,
		annee: 365 * 24 * 60 * 60 * 1000,
		annees: 365 * 24 * 60 * 60 * 1000,
	};

	static parse(duration: string): number | null {
		const regex = /^(\d+)\s*([a-zA-ZÀ-ÿ]+)$/;
		const match = duration.trim().match(regex);

		if (!match) return null;

		const value = parseInt(match[1]!);
		const unit = match[2]!;

		// Check exact match first (for 'm' vs 'M')
		if (this.UNITS[unit]) {
			return value * this.UNITS[unit]!;
		}

		// Check lowercase match
		const lowerUnit = unit.toLowerCase();
		if (this.UNITS[lowerUnit]) {
			return value * this.UNITS[lowerUnit]!;
		}

		return null;
	}
}
