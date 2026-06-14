from datetime import datetime
import uuid

def get_create_tables_sql():
    return """
    CREATE TABLE IF NOT EXISTS creator_news (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        url TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        original_summary TEXT,
        ai_summary TEXT,
        source_name TEXT,
        image_url TEXT,
        published_at TIMESTAMP,
        fetched_at TIMESTAMP DEFAULT NOW(),
        category TEXT,
        region TEXT,
        creator_tags JSONB DEFAULT '[]',
        platform_tags JSONB DEFAULT '[]',
        is_relevant BOOLEAN DEFAULT TRUE,
        relevance_score INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS news_content_ideas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        news_id UUID NOT NULL,
        platform TEXT,
        content TEXT,
        hashtags JSONB DEFAULT '[]',
        hook TEXT,
        created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS user_news_interactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        news_id UUID NOT NULL,
        action TEXT,
        created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_news_category ON creator_news(category);
    CREATE INDEX IF NOT EXISTS idx_news_published ON creator_news(published_at);
    CREATE INDEX IF NOT EXISTS idx_news_region ON creator_news(region);
    CREATE INDEX IF NOT EXISTS idx_idea_news_id ON news_content_ideas(news_id);
    CREATE INDEX IF NOT EXISTS idx_interaction_user ON user_news_interactions(user_id);
    """
