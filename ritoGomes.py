import requests
import os
import functools
from ratelimit import limits, sleep_and_retry

# key is reset every 24h 
# request limit: 20/s or 100/min
api_key = os.getenv('API_KEY')

# decorator to verify get request response
def verify_response(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        response = func(*args, **kwargs)
        if not response.ok: 
            raise Exception("Response > 200")
        return response
    return wrapper

# decorate get requests only: add rate limiting with retry and verification
requests.get = verify_response(requests.get)
requests.get = limits(calls = 100, period = 150)(requests.get)
requests.get = sleep_and_retry(requests.get)
# requests.get = sleep_and_retry(limits(calls = 100, period = 150)(requests.get))


map_region = {
    "euw1" : "europe",
    "br1" : "americas", 
}
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ API requests ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#

def request_player(region: str, summoner_name: str, byName: bool = False) -> dict:
    url="lol/summoner/v4/summoners"

    if byName:
        url += "/by-name"
    
    response = requests.get(
        f"https://{region}.api.riotgames.com/{url}/{summoner_name}",
        params = {"api_key": api_key}
    )

    return response.json()

def request_league(region: str, elo: str, queue: str = "RANKED_SOLO_5x5") -> dict: 
    return requests.get(
        f"https://{region}.api.riotgames.com/lol/league/v4/{elo}leagues/by-queue/{queue}",
        params = {"api_key": api_key}
    ).json()

# regions available for match information: americas, europe, asia, sea
def request_match_list(region: str, puuid: str, count: int = 20, start: int = 0) -> dict:
    return requests.get(
        f"https://{map_region[region]}.api.riotgames.com/lol/match/v5/matches/by-puuid/{puuid}/ids",
        params = {"type": "ranked", "start": str(start), "count": str(count), "api_key": api_key}
    ).json()

def request_match(region: str, matchid: str) -> dict:
    return requests.get(
        f"https://{map_region[region]}.api.riotgames.com/lol/match/v5/matches/{matchid}",
        params = {"api_key": api_key}
    ).json()

def request_match_timelie(region: str, matchid: str) -> dict:
    return requests.get(
        f"https://{map_region[region]}.api.riotgames.com/lol/match/v5/matches/{matchid}/timeline",
        params = {"api_key": api_key}
    ).json()

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#