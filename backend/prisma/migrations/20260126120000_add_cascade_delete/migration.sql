-- Room 삭제 시 연관 데이터(PlaylistTrack, GameHistory, GameResult) 함께 삭제되도록
-- FK를 ON DELETE CASCADE로 변경

-- PlaylistTrack.roomId
ALTER TABLE "PlaylistTrack" DROP CONSTRAINT IF EXISTS "PlaylistTrack_roomId_fkey";
ALTER TABLE "PlaylistTrack" ADD CONSTRAINT "PlaylistTrack_roomId_fkey" 
  FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- GameHistory.roomId
ALTER TABLE "GameHistory" DROP CONSTRAINT IF EXISTS "GameHistory_roomId_fkey";
ALTER TABLE "GameHistory" ADD CONSTRAINT "GameHistory_roomId_fkey" 
  FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- GameResult.gameHistoryId
ALTER TABLE "GameResult" DROP CONSTRAINT IF EXISTS "GameResult_gameHistoryId_fkey";
ALTER TABLE "GameResult" ADD CONSTRAINT "GameResult_gameHistoryId_fkey" 
  FOREIGN KEY ("gameHistoryId") REFERENCES "GameHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
