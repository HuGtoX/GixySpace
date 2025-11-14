-- 添加匿名用户相关字段
ALTER TABLE "user" 
ADD COLUMN "is_anonymous" BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN "anonymous_created_at" TIMESTAMP WITH TIME ZONE,
ADD COLUMN "expires_at" TIMESTAMP WITH TIME ZONE;

-- 为匿名用户创建索引，提高查询效率
CREATE INDEX IF NOT EXISTS "idx_user_anonymous" ON "user"("is_anonymous", "expires_at");

-- 添加注释
COMMENT ON COLUMN "user"."is_anonymous" IS '标识是否为匿名用户';
COMMENT ON COLUMN "user"."anonymous_created_at" IS '匿名用户创建时间';
COMMENT ON COLUMN "user"."expires_at" IS '匿名用户过期时间';
