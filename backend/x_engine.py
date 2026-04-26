from typing import Dict, Any, List


class XEngine:

    def __init__(self) -> None:
        pass

    # ── Main pack ──────────────────────────────────────────────────────
    def build_x_pack(self, topic: str, tone: str = "bold") -> Dict[str, Any]:
        tweet   = self.generate_tweet(topic, tone)
        thread  = self.generate_thread(topic, tone)
        replies = self.generate_reply_baits(topic)
        analysis = self.analyze_tweet(tweet)
        return {
            "tweet":              tweet,
            "thread":             thread,
            "reply_baits":        replies,
            "analysis":           analysis,
            "optimized_versions": self.optimize_variants(tweet),
        }

    # ── Tweet generator ────────────────────────────────────────────────
    def generate_tweet(self, topic: str, tone: str) -> str:
        topic = topic.strip()
        if tone == "dark":
            return f"Nobody talks about this but {topic} is silently destroying people."
        if tone == "funny":
            return f"{topic} proves humans will do everything except think logically."
        if tone == "educational":
            return f"Most people misunderstand {topic}. The real issue is how it's structured."
        if tone == "controversial":
            return f"Unpopular opinion: {topic} is not the problem. You are."
        if tone == "emotional":
            return f"{topic} hits differently when you realize how much time you've wasted."
        return f"If you're still doing {topic}, you're already behind."

    # ── Thread generator ───────────────────────────────────────────────
    def generate_thread(self, topic: str, tone: str) -> List[str]:
        return [
            f"{topic} is not what you think.",
            "Here's the reality nobody tells you:",
            "1. Most people follow blindly",
            "2. They don't question anything",
            "3. They repeat the same mistakes",
            "If you understand this, you're already ahead.",
        ]

    # ── Reply baits ────────────────────────────────────────────────────
    def generate_reply_baits(self, topic: str) -> List[str]:
        return [
            f"What's your opinion on {topic}?",
            "Agree or disagree?",
            "Be honest, do you do this too?",
            "This might trigger people but it's true.",
        ]

    # ── Viral analysis engine ──────────────────────────────────────────
    def analyze_tweet(self, tweet: str) -> Dict[str, Any]:
        words   = len(tweet.split())
        hook    = self._hook_strength(tweet)
        emotion = self._emotion_score(tweet)
        clarity = 100 - abs(18 - words) * 3
        viral_score = int((hook * 0.4) + (emotion * 0.3) + (clarity * 0.3))
        viral_score = max(0, min(100, viral_score))
        return {
            "viral_score":           viral_score,
            "hook_strength":         hook,
            "emotion_score":         emotion,
            "clarity_score":         clarity,
            "engagement_prediction": self._predict_engagement(viral_score),
            "improvements":          self._improvements(tweet),
        }

    # ── Hook detector ──────────────────────────────────────────────────
    def _hook_strength(self, tweet: str) -> int:
        hooks = ["unpopular opinion", "nobody talks", "if you're still", "truth", "stop"]
        score = 50
        for h in hooks:
            if h in tweet.lower():
                score += 25
        return min(score, 100)

    # ── Emotion score ──────────────────────────────────────────────────
    def _emotion_score(self, tweet: str) -> int:
        words = ["destroying", "truth", "problem", "wasted", "dangerous"]
        score = 40
        for w in words:
            if w in tweet.lower():
                score += 15
        return min(score, 100)

    # ── Engagement prediction ──────────────────────────────────────────
    def _predict_engagement(self, score: int) -> Dict[str, int]:
        return {
            "likes":    score * 12,
            "retweets": score * 5,
            "comments": score * 3,
            "shares":   score * 4,
        }

    # ── Improvement suggestions ────────────────────────────────────────
    def _improvements(self, tweet: str) -> List[str]:
        suggestions = []
        if len(tweet.split()) < 10:
            suggestions.append("Increase length slightly")
        if "?" not in tweet:
            suggestions.append("Add a question for engagement")
        if "you" not in tweet.lower():
            suggestions.append("Make it more direct")
        return suggestions

    # ── Optimizer ──────────────────────────────────────────────────────
    def optimize_variants(self, tweet: str) -> List[str]:
        return [
            tweet,
            tweet.upper(),
            tweet + " Thoughts?",
            "🔥 " + tweet,
            tweet.replace("is", "might be"),
        ]