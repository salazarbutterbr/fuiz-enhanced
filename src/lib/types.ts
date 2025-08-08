import type { AvailableLanguageTag } from '$lib/paraglide/runtime.js';

export type Image =
	| {
			Base64: {
				data: string;
				hash?: string;
				alt: string;
			};
	  }
	| {
			Corkboard: {
				id: string;
				alt: string;
			};
	  }
	| {
			Url: {
				url: string;
				alt: string;
			};
	  };

export type Media = {
	Image: Image;
};

export type TextOrMedia = {
	Text: string;
};

export type AnswerResult = {
	correct: boolean;
	count: number;
};

export type IdlessMultipleChoiceAnswer = {
	correct: boolean;
	content: TextOrMedia;
};

export type MultipleChoiceAnswer = IdlessMultipleChoiceAnswer & {
	id: number;
};

export type GenericIdlessMultipleChoiceSlide<T> = {
	title: string;
	media?: T;
	introduce_question: number;
	time_limit: number;
	points_awarded: number;
	answers: IdlessMultipleChoiceAnswer[];
};

export type IdlessMultipleChoiceSlide = GenericIdlessMultipleChoiceSlide<Media | undefined>;

export type GenericIdlessTypeAnswer<T> = {
	title: string;
	media?: T;
	introduce_question: number;
	time_limit: number;
	points_awarded: number;
	answers: string[];
	case_sensitive: boolean;
};

export type IdlessTypeAnswer = GenericIdlessTypeAnswer<Media | undefined>;

export type GenericIdlessOrderSlide<T> = {
	title: string;
	media?: T;
	introduce_question: number;
	time_limit: number;
	points_awarded: number;
	axis_labels: {
		from?: string;
		to?: string;
	};
	answers: string[];
};

export type IdlessOrderSlide = GenericIdlessOrderSlide<Media | undefined>;

export type GenericOrderSlide<T> = Modify<
	GenericIdlessOrderSlide<T>,
	{
		answers: {
			text: string;
			id: number;
		}[];
	}
>;

export type OrderSlide = GenericOrderSlide<Media | undefined>;

export type GenericMultipleChoiceSlide<T> = Modify<
	GenericIdlessMultipleChoiceSlide<T>,
	{
		answers: MultipleChoiceAnswer[];
	}
>;

export type MultipleChoiceSlide = GenericMultipleChoiceSlide<Media | undefined>;

export type GenericTypeAnswer<T> = Modify<
	GenericIdlessTypeAnswer<T>,
	{
		answers: {
			text: string;
			id: number;
		}[];
	}
>;

export type TypeAnswer = GenericTypeAnswer<Media | undefined>;

export function getMedia<T>(slide: GenericIdlessSlide<T> | GenericSlide<T>): T | undefined {
	if ('MultipleChoice' in slide) {
		return slide.MultipleChoice.media;
	} else if ('TypeAnswer' in slide) {
		return slide.TypeAnswer.media;
	} else if ('Order' in slide) {
		return slide.Order.media;
	}
	return undefined;
}

export async function mapMedia<T, O>(
	slide: GenericSlide<T>,
	map: (media: T) => Promise<O>
): Promise<GenericSlide<O>> {
	if ('MultipleChoice' in slide) {
		const media = slide.MultipleChoice.media;
		const newMedia = media ? await map(media) : undefined;
		return {
			MultipleChoice: {
				...slide.MultipleChoice,
				media: newMedia
			},
			id: slide.id
		} as GenericSlide<O>;
	} else if ('TypeAnswer' in slide) {
		const media = slide.TypeAnswer.media;
		const newMedia = media ? await map(media) : undefined;
		return {
			TypeAnswer: {
				...slide.TypeAnswer,
				media: newMedia
			},
			id: slide.id
		} as GenericSlide<O>;
	} else if ('Order' in slide) {
		const media = slide.Order.media;
		const newMedia = media ? await map(media) : undefined;
		return {
			Order: {
				...slide.Order,
				media: newMedia
			},
			id: slide.id
		} as GenericSlide<O>;
	}
	throw new Error('Unknown slide type');
}

export async function mapIdlessMedia<T, O>(
	slide: GenericIdlessSlide<T>,
	map: (media: T) => Promise<O>
): Promise<GenericIdlessSlide<O>> {
	if ('MultipleChoice' in slide) {
		const media = slide.MultipleChoice.media;
		const newMedia = media ? await map(media) : undefined;
		return {
			MultipleChoice: {
				...slide.MultipleChoice,
				media: newMedia
			}
		} as GenericIdlessSlide<O>;
	} else if ('TypeAnswer' in slide) {
		const media = slide.TypeAnswer.media;
		const newMedia = media ? await map(media) : undefined;
		return {
			TypeAnswer: {
				...slide.TypeAnswer,
				media: newMedia
			}
		} as GenericIdlessSlide<O>;
	} else if ('Order' in slide) {
		const media = slide.Order.media;
		const newMedia = media ? await map(media) : undefined;
		return {
			Order: {
				...slide.Order,
				media: newMedia
			}
		} as GenericIdlessSlide<O>;
	}
	throw new Error('Unknown slide type');
}

export type GenericIdlessSlide<T> =
	| {
			MultipleChoice: GenericIdlessMultipleChoiceSlide<T>;
	  }
	| {
			TypeAnswer: GenericIdlessTypeAnswer<T>;
	  }
	| {
			Order: GenericIdlessOrderSlide<T>;
	  };

export type IdlessSlide = GenericIdlessSlide<Media | undefined>;

export type GenericSlide<T> =
	| {
			MultipleChoice: GenericMultipleChoiceSlide<T>;
			id: number;
	  }
	| {
			TypeAnswer: GenericTypeAnswer<T>;
			id: number;
	  }
	| {
			Order: GenericOrderSlide<T>;
			id: number;
	  };

export type Slide = GenericSlide<Media | undefined>;

export type GenericFuizConfig<T> = {
	title: string;
	slides: GenericSlide<T>[];
	// Enhanced: Support for multiple languages
	languages?: {
		primary: AvailableLanguageTag;
		available: AvailableLanguageTag[];
		translations?: Record<AvailableLanguageTag, {
			title: string;
			slides: GenericIdlessSlide<T>[];
		}>;
	};
};

export type FuizConfig = GenericFuizConfig<Media | undefined>;

export type GenericIdlessFuizConfig<T> = {
	title: string;
	slides: GenericIdlessSlide<T>[];
	// Enhanced: Support for multiple languages
	languages?: {
		primary: AvailableLanguageTag;
		available: AvailableLanguageTag[];
		translations?: Record<AvailableLanguageTag, {
			title: string;
			slides: GenericIdlessSlide<T>[];
		}>;
	};
};

export type IdlessFuizConfig = GenericIdlessFuizConfig<Media | undefined>;

export type Creation = {
	id: number;
	title: string;
	lastEdited: number;
	slidesCount: number;
	media?: Media | undefined;
	// Enhanced: Language information
	primaryLanguage?: AvailableLanguageTag;
	availableLanguages?: AvailableLanguageTag[];
};

export type NameStyle =
	| {
			Roman: 2 | 3;
	  }
	| {
			Petname: 2 | 3;
	  };

export type FuizOptions = {
	random_names: NameStyle | null;
	show_answers: boolean;
	no_leaderboard: boolean;
	teams?: {
		size: number;
		assign_random: boolean;
	};
	// Enhanced: CSV export options
	enable_csv_export?: boolean;
	csv_export_fields?: ('nickname' | 'score' | 'team' | 'answers' | 'response_time')[];
};

export type ServerPossiblyHidden<T> =
	| {
			Visible: T;
	  }
	| 'Hidden';

export type PublishedFuizDB = {
	storage_id: number;
	title: string;
	author: string;
	published_at: string;
	subjects: string;
	grades: string;
	slides_count: number;
	played_count: number;
	thumbnail_alt: string | null;
	language_code: string;
	thumbnail: ArrayBuffer | null;
	// Enhanced: Multiple language support
	available_languages?: string;
	primary_language?: string;
};

export type Modify<T, R extends PartialAny<T>> = Omit<T, keyof R> & R;

type PartialAny<T> = {
	[P in keyof T]?: any;
};

export type PublishedFuiz = Modify<
	PublishedFuizDB,
	{
		thumbnail: string | null;
		subjects: string[];
		grades: string[];
		published_at: Date;
		language: AvailableLanguageTag;
		// Enhanced: Multiple language support
		availableLanguages?: AvailableLanguageTag[];
		primaryLanguage?: AvailableLanguageTag;
	}
>;

export type OnlineFuiz = {
	author: string;
	subjects?: string[];
	grades?: string[];
	language: string;
	config: IdlessFuizConfig;
	// Enhanced: Multiple language support
	availableLanguages?: AvailableLanguageTag[];
	primaryLanguage?: AvailableLanguageTag;
};

// Enhanced: CSV Export Types
export type ParticipantData = {
	nickname: string;
	score: number;
	team?: string;
	answers: {
		questionIndex: number;
		questionTitle: string;
		answer: string;
		correct: boolean;
		responseTime: number;
		points: number;
	}[];
	totalResponseTime: number;
	correctAnswers: number;
	totalQuestions: number;
	accuracy: number;
};

export type CSVExportData = {
	quizTitle: string;
	quizLanguage: AvailableLanguageTag;
	exportDate: string;
	participants: ParticipantData[];
	summary: {
		totalParticipants: number;
		averageScore: number;
		highestScore: number;
		lowestScore: number;
		averageAccuracy: number;
	};
};

// Enhanced: Language Management Types
export type LanguageConfig = {
	code: AvailableLanguageTag;
	name: string;
	flag?: string;
	rtl?: boolean;
};

export type QuizTranslation = {
	language: AvailableLanguageTag;
	title: string;
	slides: IdlessSlide[];
	lastUpdated: number;
};
