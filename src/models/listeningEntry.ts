export interface ListeningEntry {
    endTime: string;
    date: Date;
    artistName: string;
    trackName: string;
    msPlayed: number;
}

export interface ExtendedListeningEntry {
    ts: string;
    ms_played: number;
    master_metadata_track_name: string | null;
    master_metadata_album_artist_name: string | null;
}