import type { Podcast } from '../types/podcast';

// Curated seed catalog — 20 popular podcasts across 8 categories
export const SEED_PODCASTS: Podcast[] = [
  // Technology
  {
    id: '1200361736',
    title: 'Lex Fridman Podcast',
    author: 'Lex Fridman',
    description: 'Conversations about science, technology, history, philosophy and the nature of intelligence.',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts115/v4/88/b7/c0/88b7c039-4cdf-4c9d-9b1e-39fc7f87c9de/mza_4662083095059793640.jpg/600x600bb.jpg',
    feedUrl: 'https://lexfridman.com/feed/podcast/',
    categories: ['Technology', 'Science'],
  },
  {
    id: '1481907445',
    title: 'All-In Podcast',
    author: 'All-In Podcast, LLC',
    description: 'Industry veterans, Chamath Palihapitiya, Jason Calacanis, David Sacks & David Friedberg.',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts125/v4/41/58/88/415888d5-3ade-ec31-3f77-5d5b2c0b9cd1/mza_10261698988079421499.jpg/600x600bb.jpg',
    feedUrl: 'https://feeds.megaphone.fm/allin',
    categories: ['Technology', 'Business'],
  },
  {
    id: '1527587184',
    title: 'Darknet Diaries',
    author: 'Jack Rhysider',
    description: 'True stories from the dark side of the internet.',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts126/v4/33/db/e1/33dbe1c3-8f94-c4d0-6c83-4efbdcc20d9b/mza_17079552466468729591.jpg/600x600bb.jpg',
    feedUrl: 'https://darknetdiaries.com/feed.xml',
    categories: ['Technology', 'True Crime'],
  },
  // Science
  {
    id: '1200361737',
    title: 'Huberman Lab',
    author: 'Scicomm Media',
    description: 'Science and science-based tools for everyday life.',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts125/v4/a5/e4/9c/a5e49c25-cf6b-4be2-9485-5a1e3ef3acb4/mza_4153498775507502687.jpg/600x600bb.jpg',
    feedUrl: 'https://feeds.megaphone.fm/hubermanlab',
    categories: ['Science', 'Health'],
  },
  {
    id: '1200361738',
    title: 'Radiolab',
    author: 'WNYC Studios',
    description: 'Investigating a strange world.',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts115/v4/be/99/90/be9990f9-6bc8-2326-b12b-d6c85caa9155/mza_8834879787655090918.jpg/600x600bb.jpg',
    feedUrl: 'https://feeds.wnyc.org/radiolab',
    categories: ['Science', 'Education'],
  },
  // Business
  {
    id: '1200361739',
    title: 'How I Built This',
    author: 'NPR',
    description: 'Stories behind some of the world\'s best-known companies.',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts125/v4/01/71/9e/01719ee0-7ef2-af27-0e22-b9cb2c0e2b2d/mza_13276905218735278843.jpg/600x600bb.jpg',
    feedUrl: 'https://feeds.npr.org/510313/podcast.xml',
    categories: ['Business', 'Education'],
  },
  {
    id: '1200361740',
    title: 'Masters of Scale',
    author: 'Wondery | Masters of Scale',
    description: 'Unconventional theory for how companies grow to become massive.',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/82/57/ef/8257ef46-10eb-2e09-0a8b-e5b04f08ece9/mza_8849680028397085804.jpg/600x600bb.jpg',
    feedUrl: 'https://feeds.megaphone.fm/mastersofscale',
    categories: ['Business'],
  },
  // True Crime
  {
    id: '1200361741',
    title: 'Serial',
    author: 'Serial Productions',
    description: 'One story told week by week.',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts125/v4/5a/d7/74/5ad7747c-3fe1-d4ad-5e5f-dca697e64c6f/mza_13895360073085337729.jpg/600x600bb.jpg',
    feedUrl: 'https://feeds.simplecast.com/xl56GnRn',
    categories: ['True Crime'],
  },
  {
    id: '1200361742',
    title: 'Crime Junkie',
    author: 'audiochuck',
    description: 'If you can never get enough true crime.',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts115/v4/5a/58/75/5a5875ad-c52f-6b7a-4fe3-3bb22fcbd9a7/mza_16978578665618046889.jpg/600x600bb.jpg',
    feedUrl: 'https://feeds.simplecast.com/qm_9xx0g',
    categories: ['True Crime'],
  },
  // Comedy
  {
    id: '1200361743',
    title: 'Conan O\'Brien Needs a Friend',
    author: 'Team Coco & Earwolf',
    description: 'Conan O\'Brien searches for his one true friend.',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts125/v4/ea/e0/a4/eae0a43a-4d12-53db-4cb0-8abd4a1b2b57/mza_14568441025019869516.jpg/600x600bb.jpg',
    feedUrl: 'https://feeds.simplecast.com/dHoohVNH',
    categories: ['Comedy'],
  },
  {
    id: '1200361744',
    title: 'My Brother, My Brother And Me',
    author: 'Maximum Fun',
    description: 'An advice show for the modern era.',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts115/v4/57/c0/e5/57c0e5a9-7e11-a50e-f7d9-c23ef3bcab80/mza_8938462462826803083.jpg/600x600bb.jpg',
    feedUrl: 'https://feeds.maximumfun.org/my-brother-my-brother-and-me',
    categories: ['Comedy'],
  },
  // News
  {
    id: '1200361745',
    title: 'The Daily',
    author: 'The New York Times',
    description: 'The biggest stories of our time, told by the best journalists.',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts125/v4/cc/0c/01/cc0c0184-1d83-6b5a-7dbc-e56b2d8f5e2d/mza_9765623312820050568.jpg/600x600bb.jpg',
    feedUrl: 'https://feeds.simplecast.com/54nAGcIl',
    categories: ['News'],
  },
  {
    id: '1200361746',
    title: 'Up First',
    author: 'NPR',
    description: 'NPR\'s Up First is the news you need to start your day.',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts125/v4/e0/49/2a/e0492a3e-dd2e-bdf5-c58b-e0fa97d94d29/mza_17985949545124523862.jpg/600x600bb.jpg',
    feedUrl: 'https://feeds.npr.org/510318/podcast.xml',
    categories: ['News'],
  },
  // Health
  {
    id: '1200361747',
    title: 'Feel Better, Live More',
    author: 'Dr Rangan Chatterjee',
    description: 'The podcast about living a healthier, happier life.',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts115/v4/83/86/05/8386059a-53b3-5a0d-8dbb-7a7ac08e5bd8/mza_9200258462882289218.jpg/600x600bb.jpg',
    feedUrl: 'https://feeds.acast.com/public/shows/feelingbetterlivemore',
    categories: ['Health'],
  },
  // History
  {
    id: '1200361748',
    title: 'Hardcore History',
    author: 'Dan Carlin',
    description: 'In "Hardcore History" journalist and broadcaster Dan Carlin takes his "Martian" perspective and applies it to the past.',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts125/v4/5a/97/0b/5a970b62-c9af-3b8d-7f95-a32f4e72b527/mza_8985063601316896781.jpg/600x600bb.jpg',
    feedUrl: 'https://podcast.dancarlin.com/feed/',
    categories: ['History', 'Education'],
  },
  {
    id: '1200361749',
    title: 'Revolutions',
    author: 'Mike Duncan',
    description: 'The great political revolutions of the modern world.',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts125/v4/28/54/52/285452e0-1eb7-d5af-ca03-c57ca0c91bc7/mza_2454018861428498029.jpg/600x600bb.jpg',
    feedUrl: 'https://feeds.simplecast.com/Nn9A7GVn',
    categories: ['History'],
  },
  // Society
  {
    id: '1200361750',
    title: 'Stuff You Should Know',
    author: 'iHeartPodcasts',
    description: 'If you\'ve ever wanted to know about champagne, satanism, the Stonewall Uprising, chaos theory, etc.',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts115/v4/7a/7a/7a/7a7a7af9-c92b-3d2a-e72e-5c6a45484ab5/mza_7928948654150098887.jpg/600x600bb.jpg',
    feedUrl: 'https://feeds.megaphone.fm/stuffyoushouldknow',
    categories: ['Education', 'Society'],
  },
  {
    id: '1200361751',
    title: 'Freakonomics Radio',
    author: 'Freakonomics Radio + Stitcher',
    description: 'Surprising and often counterintuitive takes on economics and society.',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/90/1e/50/901e509f-ea21-3756-ad08-a9da6e8e0b6b/mza_14337543703044924428.jpg/600x600bb.jpg',
    feedUrl: 'https://feeds.simplecast.com/Y8lFbOT4',
    categories: ['Society', 'Business'],
  },
  // Sports
  {
    id: '1200361752',
    title: 'The Bill Simmons Podcast',
    author: 'The Ringer',
    description: 'HBO and The Ringer\'s Bill Simmons talks NFL, NBA, and pop culture.',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts125/v4/f7/ce/2a/f7ce2a54-5ab2-a35b-98f3-35da2d79f7c5/mza_16186064742789384440.jpg/600x600bb.jpg',
    feedUrl: 'https://feeds.megaphone.fm/the-bill-simmons-podcast',
    categories: ['Sports'],
  },
  // Arts
  {
    id: '1200361753',
    title: 'Song Exploder',
    author: 'Hrishikesh Hirway',
    description: 'Musicians take apart their songs and discuss how it was made.',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts125/v4/e5/04/e2/e504e2c8-2f93-3640-7e72-0e90c0acf9d0/mza_10786524744576818.jpg/600x600bb.jpg',
    feedUrl: 'https://feeds.simplecast.com/OvEKUzYy',
    categories: ['Arts', 'Education'],
  },
];

export const ALL_CATEGORIES = [
  'Technology', 'Business', 'Science', 'Health',
  'True Crime', 'Comedy', 'News', 'Society',
  'Education', 'Sports', 'Arts', 'History',
] as const;

export function getPodcastsByCategory(category: string): Podcast[] {
  return SEED_PODCASTS.filter(p => p.categories.includes(category));
}
