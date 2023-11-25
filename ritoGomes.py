import requests
import os
import functools
from ratelimit import limits, sleep_and_retry

# key must be reset every 24h 
# request limit: 20/s or 100/min
api_key = os.getenv('API_KEY')
if api_key is None:
    raise Exception("Provide API_KEY")
default_patch = "13.19.1"

# decorator to verify get request response
def verify_response(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        response = func(*args, **kwargs)
        if not response.ok: 
            print(response)
            raise Exception(f"Error: {response.status_code}")
        return response
    return wrapper

# decorate get requests only: add rate limiting with retry and verification
requests.get = verify_response(requests.get)
requests.get = limits(calls = 100, period = 150)(requests.get)
requests.get = sleep_and_retry(requests.get)

map_region = {
    "euw1" : "europe",
    "eun1" : "europe",
    "tr1" : "europe",
    "ru" : "europe",
    "br1" : "americas",
    "na1" : "americas",
    "la1" : "americas",
    "la2" : "americas",
    "kr" : "asia",
    "jp1" : "asia",
    "oc1" : "sea",
    "ph2" : "sea",
    "sg2" : "sea",
    "th2" : "sea",
    "tw2" : "sea",
    "vn2" : "sea",
}
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ API requests ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
"""
Return player information of $region from summonerId (def.) or name

use case: capture player's 'puuid' 
"""
def request_player(region: str, summoner: str, byName: bool = False) -> dict:
    url="lol/summoner/v4/summoners"

    if byName:
        url += "/by-name"
    
    return requests.get(
        f"https://{region}.api.riotgames.com/{url}/{summoner}",
        params = {"api_key": api_key}
    ).json()


"""
Return informations about the players from $region in $elo

use case: get summonerIds
"""
def request_league(region: str, elo: str, queue: str = "RANKED_SOLO_5x5") -> dict: 
    return requests.get(
        f"https://{region}.api.riotgames.com/lol/league/v4/{elo}leagues/by-queue/{queue}",
        params = {"api_key": api_key}
    ).json()

"""
Return $count matches starting at $start index for player with $puuid from $region

use case: get list of match ids
"""
def request_match_list(region: str, puuid: str, count: int = 20, start: int = 0) -> dict:
    # regions available for match information: americas, europe, asia, sea
    return requests.get(
        f"https://{map_region[region]}.api.riotgames.com/lol/match/v5/matches/by-puuid/{puuid}/ids",
        params = {"type": "ranked", "start": str(start), "count": str(count), "api_key": api_key}
    ).json()

"""
Return general match information from its $matchid and $region
"""
def request_match_data(region: str, matchid: str) -> dict:
    return requests.get(
        f"https://{map_region[region]}.api.riotgames.com/lol/match/v5/matches/{matchid}",
        params = {"api_key": api_key}
    ).json()

"""
Return detailed mach information for every minute in the game from its $match and $region
"""
def request_match_timelie(region: str, matchid: str) -> dict:
    return requests.get(
        f"https://{map_region[region]}.api.riotgames.com/lol/match/v5/matches/{matchid}/timeline",
        params = {"api_key": api_key}
    ).json()

"""
Return dict {paticipant_idx : champion} for match from its $region and $matchid

*participant_idx is 1-idx and in str format
"""
def request_champions_in_match(region: str, matchid: str) -> list:
    match_data = request_match_data(region, matchid)
    champion_list = [participant['championName'] for participant in match_data['info']['participants']]
    return champion_list

def request_champions_id(patch = default_patch) -> dict:
    champion_data = requests.get(f"http://ddragon.leagueoflegends.com/cdn/{patch}/data/en_US/champion.json").json()
    id_to_name = dict()
    for champion in champion_data['data'].values():
        # champion['key'] is id  (e.g. 266) and champion['id'] is name (e.g. Aatrox)
        id_to_name[int(champion['key'])] = champion['id']
    return id_to_name
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
