import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.asyncio import async_sessionmaker

DATABASE = os.getenv('DATABASE')
DB_USER = os.getenv('DB_USER')
DB_PWD = os.getenv('DB_PWD')
DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PWD}@localhost:5432/{DATABASE}"

engine = create_async_engine(DATABASE_URL, echo=True)
SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)
Base = declarative_base()
