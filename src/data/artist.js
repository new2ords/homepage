export const artist = {
  name: 'new²ords',
  links: {
    bandcampMeteor:
      'https://new2ords.bandcamp.com/track/meteor-6-6-26-wedding-version',
    spotifyMeteor: '',
    instagram: 'https://www.instagram.com/new2ords/',
    discord: 'https://discord.gg/6RXXz6hUKJ',
    email: 'hello@new2ords.com',
  },
  release: {
    title: 'meteor',
    bandcampTrackId: '1562974215',
    youtubeVideoId: '',
    // Adjust once during authoring if every lyric feels consistently early/late.
    lyricOffsetMs: 0,
    // Replace null with each word's start time in seconds.
    // YouTube's current playback time is the source of truth at runtime.
    lyrics: [
      ['Meteor', null], ['Fall', null], ['through', null], ['the', null],
      ['sky', null], ['A', null], ['million', null], ['and', null],
      ['one', null], ['Stars', null], ['in', null], ['your', null],
      ['eyes', null], ['Late', null], ['at', null], ['night', null],
      ['I', null], ["don't", null], ['know', null], ['how', null],
      ['You', null], ['make', null], ['time', null], ['feel', null],
      ['slow', null], ['Every', null], ['time', null], ["we're", null],
      ['close', null], ['Till', null], ['the', null], ['world', null],
      ['fades', null], ['out', null], ['of', null], ['view', null],
      ["I'll", null], ['be', null], ['there', null], ['for', null],
      ['you', null], ['Time', null], ['goes', null], ['by', null],
      ['through', null], ['the', null], ['signals', null], ['We', null],
      ['lost', null], ['track', null], ['in', null], ['the', null],
      ['star', null], ['trails', null], ["It's", null], ['a', null],
      ['black', null], ['and', null], ['white', null], ['world', null],
      ['without', null], ['you', null], ['I', null], ['need', null],
      ['a', null], ['comet', null], ['Checking', null], ['money', null],
      ['in', null], ['the', null], ['bank', null], ['Years', null],
      ['running', null], ['us', null], ['by', null], ['Mind', null],
      ['spinning', null], ['in', null], ['circles', null], ['Got', null],
      ['me', null], ['turning', null], ['at', null], ['night', null],
      ['Feeling', null], ['out', null], ['of', null], ['my', null],
      ['body', null], ['Took', null], ['a', null], ['nebula', null],
      ['flight', null], ['Free', null], ['falling', null], ['at', null],
      ['light', null], ['speed', null], ["We're", null], ['moving', null],
      ['in', null], ['time', null],
    ],
  },
}

export const forthcomingPlatforms = [
  { name: 'spotify' },
  { name: 'apple music' },
  { name: 'youtube' },
]

artist.release.lyrics = artist.release.lyrics.map(([text, start]) => ({
  text,
  start,
}))

export const atmosphereWords = [
  'echolalia',
  'nocturne',
  'afterlight',
  'silverspeak',
  'stelliferous',
  'lucid',
  'ethereal',
  'vesper',
  'threnody',
  'aubade',
  'liminal',
  'palimpsest',
]

export const marginalia = [
  '“this one”',
  '“here”',
  '“remember”',
  '“yes”',
  '“again”',
  '“softly”',
  '“almost”',
  '“still”',
  '“listen”',
  '“now”',
]
