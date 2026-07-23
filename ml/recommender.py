import numpy as np
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import StandardScaler

VALID_CLASS_IDS = {
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, 15, 16, 17, 18,
    19, 20, 21, 22, 23, 24, 26, 28,
    29, 30, 31, 32, 33, 34, 35, 36,
    41, 44, 45, 46, 47, 48, 49, 50,
    51, 53, 54, 55, 56, 57, 58, 59,
    60, 61, 62, 63, 64, 66, 67, 68,
    70, 71, 72,
}

class ClassRecommender:
    def __init__(self):
        self.scaler = StandardScaler()
        self.knn = None
        self.players = []
        # Stores each player's win rate for each class
        self.player_classes = {}

    @property
    def ready(self):
        return self.knn is not None

    def get_features(self, player):
        games = player["Wins"] + player["Losses"]

        # Player profile used to find similar players
        return [
            player["Kills"] / max(player["Deaths"], 1),
            player["Wins"] / max(games, 1),
            player["FlawlessWins"] / max(player["Wins"], 1),
            player["MatchMvps"] / max(games, 1),
            player["Level"],
            player["BestWinstreak"]
        ]

    def train(self, df_players, df_classes):
        training_data = []

        for player in df_players.to_dict("records"):
            training_data.append(self.get_features(player))
            self.players.append(player["UUID"])

        valid_classes = df_classes[
            (df_classes["ClassID"].isin(VALID_CLASS_IDS)) &
            (df_classes["GamesPlayed"] >= 5)
        ]

        for row in valid_classes.to_dict("records"):
            uuid = row["UUID"]

            if uuid not in self.player_classes:
                self.player_classes[uuid] = {}

            self.player_classes[uuid][row["ClassID"]] = (
                row["GamesWon"] / row["GamesPlayed"]
            )

        training_data = self.scaler.fit_transform(
            np.array(training_data)
        )

        # Finds players with similar stat profiles
        self.knn = NearestNeighbors(
            n_neighbors=min(20, len(training_data)),
            metric="cosine"
        )

        self.knn.fit(training_data)

    def recommend(self, wins, losses, kills, deaths, flawless_wins, match_mvps, level, best_winstreak, class_stats, top_n=3):
        player = {
            "Wins": wins,
            "Losses": losses,
            "Kills": kills,
            "Deaths": deaths,
            "FlawlessWins": flawless_wins,
            "MatchMvps": match_mvps,
            "Level": level,
            "BestWinstreak": best_winstreak
        }

        features = self.get_features(player)

        features = self.scaler.transform([features])

        # Find players with similar stats
        distances, indexes = self.knn.kneighbors(features)

        similar_scores = {}

        for distance, index in zip(distances[0], indexes[0]):
            uuid = self.players[index]
            similarity = 1 - distance

            for class_id, win_rate in self.player_classes.get(uuid, {}).items():
                if class_id not in similar_scores:
                    similar_scores[class_id] = 0

                similar_scores[class_id] += similarity * win_rate

        personal_scores = {}

        for class_info in class_stats:
            class_id = class_info["ClassID"]

            if class_id not in VALID_CLASS_IDS:
                continue

            if class_info["GamesPlayed"] < 5:
                continue

            personal_scores[class_id] = (
                class_info["GamesWon"] / class_info["GamesPlayed"]
            )

        if similar_scores:
            highest = max(similar_scores.values())

            for class_id in similar_scores:
                similar_scores[class_id] /= highest

        if personal_scores:
            highest = max(personal_scores.values())

            for class_id in personal_scores:
                personal_scores[class_id] /= highest

        final_scores = {}

        all_classes = set(similar_scores) | set(personal_scores)

        # 60% personal performance, 40% similar players
        for class_id in all_classes:
            final_scores[class_id] = (
                personal_scores.get(class_id, 0) * 0.6 +
                similar_scores.get(class_id, 0) * 0.4
            )

        results = []

        best_score = max(final_scores.values())

        for class_id, score in final_scores.items():
            results.append({
                "classId": int(class_id),
                "confidence": round((score / best_score) * 100, 1)
            })

        results.sort(
            key=lambda x: x["confidence"],
            reverse=True
        )

        return results[:top_n]