import json
import ritoGomes as riot
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class Champion:
    name: str
    kills: int = 0
    deaths: int = 0
    assists: int = 0
    wins: int = 0
    role: dict[str, int] = None # top, 10; adc, 20

@dataclass
class Region:
    name: str
    champions: List[Champion] = None

"""
Updates the match list containing the
union of the $games_per_player last matches of every player in $elo from $region

e.g. 
games_per_player: 20 
region: euw1, br1
elo: challenger, grandmaster, master

"""
def update_match_list(region: str, elo: str, games_per_player: int = 20):
    with open(f'data/matchid_{region}_{elo}.json', 'w') as json_file:
        new_match_list = set()
        league = riot.request_league(region, elo)
        for i, item in enumerate(league['entries']):
            player = riot.request_player(region, item['summonerId'])
            new_match_list.update(riot.request_match_list(region, player['puuid'], count = games_per_player))
            print(i, item['summonerName'])

        json.dump(list(new_match_list), json_file)


def update_heatmap_from_match(region : str, matchid : str, heatmap_data : dict):

    match_data = riot.request_match(region, matchid)
    part_champ = {str(i+1) : participant['championName'] for i, participant in enumerate(match_data['info']['participants'])}

    timeline_data = riot.request_match_timelie(region, matchid)

    for frame, frame_data in enumerate(timeline_data['info']['frames']):
        for participant, champion in part_champ.items():
            if champion not in heatmap_data.keys():
                heatmap_data[champion] = dict()
            if frame not in heatmap_data[champion].keys():
                heatmap_data[champion][frame] = []
                        
            heatmap_data[champion][frame].append(frame_data['participantFrames'][participant]['position'])


def update_heatmap(region : str, elo : str):
    try:
        with open(f'data/heatmap_{region}_{elo}.json', 'r') as json_file:
            heatmap_data = json.load(json_file)
    except FileNotFoundError:
        heatmap_data = dict()

    with open(f'data/matchid_{region}_{elo}.json', 'r') as json_file:
        matchid_data = json.load(json_file)

    for i, matchid in enumerate(matchid_data):
        update_heatmap_from_match(region, matchid, heatmap_data)
        print(i, matchid)

    with open(f'data/heatmap_{region}_{elo}.json', 'w') as json_file:
        json.dump(heatmap_data, json_file)

# update_match_list('euw1', 'challenger')
update_heatmap('euw1', 'challenger')