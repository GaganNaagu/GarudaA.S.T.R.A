import asyncio
from database.scripts.seed_demo_data import seed

if __name__ == "__main__":
    asyncio.run(seed())
