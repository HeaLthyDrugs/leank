// Get TURN server credentials from environment variables
const TURN_SERVER_URL = process.env.NEXT_PUBLIC_TURN_SERVER_URL || 'standard.relay.metered.ca';
const TURN_USERNAME = process.env.NEXT_PUBLIC_TURN_USERNAME || '';
const TURN_CREDENTIAL = process.env.NEXT_PUBLIC_TURN_CREDENTIAL || '';

export const TRYSTERO_CONFIG = {
  appId: 'leank-p2p-v1',
  rtcConfig: {
    iceServers: [
      {
        urls: "stun:stun.relay.metered.ca:80",
      },
      {
        urls: `turn:${TURN_SERVER_URL}:80`,
        username: TURN_USERNAME,
        credential: TURN_CREDENTIAL,
      },
      {
        urls: `turn:${TURN_SERVER_URL}:80?transport=tcp`,
        username: TURN_USERNAME,
        credential: TURN_CREDENTIAL,
      },
      {
        urls: `turn:${TURN_SERVER_URL}:443`,
        username: TURN_USERNAME,
        credential: TURN_CREDENTIAL,
      },
      {
        urls: `turns:${TURN_SERVER_URL}:443?transport=tcp`,
        username: TURN_USERNAME,
        credential: TURN_CREDENTIAL,
      },
    ]
  },
  trackerUrls: [
    'wss://tracker.openwebtorrent.com',
    'wss://tracker.webtorrent.dev',
    'wss://tracker.files.fm:7073/announce'
  ]
};
