import json
import ritoGomes as riot
from typing import Optional, Union, List

# Utility 
def write_to_json(data : Union[dict, list], file_name : str) -> None:
    with open(file_name, 'w') as json_file:
        json.dump(data, json_file)

def read_json(file_name : str) -> Optional[dict]:
    try:
        with open(file_name, 'r') as json_file:
            return json.load(json_file)
    except FileNotFoundError:
        return None
    
"""
Updates the match list containing the
union of the $games_per_player last matches of every player in $elo from $region
"""
def update_matchid_list(region: str, elo: str, games_per_player: int = 20) -> None:
    matchid_list = set()
    league = riot.request_league(region, elo)
    for i, item in enumerate(league['entries'], 1):
        player = riot.request_player(region, item['summonerId'])
        matchid_list.update(riot.request_match_list(region, player['puuid'], count = games_per_player))
        print(i, item['summonerName'])

    write_to_json(list(matchid_list), f'raw_data/matchid_{region}_{elo}.json')

"""
Updates heatmap data containing 
a list of positions for every minute in the game of each champion

[champion] -> [minute] -> {x, y}

"""
def update_heatmap(region: str, elo: str) -> None:
    # update heatmap_data containing 
    def update_heatmap_from_match(matchid: str, heatmap_data: dict) -> None:

        champion_list = riot.request_champions_in_match(region, matchid)
        timeline_data = riot.request_match_timelie(region, matchid)
        
        for frame_idx, frame_data in enumerate(timeline_data['info']['frames']):
            for participant_idx, champion in enumerate(champion_list, 1):
                if champion not in heatmap_data.keys():
                    heatmap_data[champion] = dict()
                if frame_idx not in heatmap_data[champion].keys():
                    heatmap_data[champion][frame_idx] = []
                heatmap_data[champion][frame_idx].append(frame_data['participantFrames'][str(participant_idx)]['position'])
    
    # read matchid data
    if not (matchid_data := read_json(f'raw_data/matchid_{region}_{elo}.json')):
        print('matchid file not found')
        return
    
    # read heatmap data
    if not (heatmap_data := read_json(f'raw_data/heatmap_{region}_{elo}.json')):
        heatmap_data = dict()
    
    # update heatmap data using all matches
    for i, matchid in enumerate(matchid_data, 1):
        try:
            update_heatmap_from_match(matchid, heatmap_data)
        except Exception as e:
            print(i, str(e))
            continue
        print(f"(Heatmap, {i}): {matchid}")

    write_to_json(heatmap_data, f'raw_data/heatmap_{region}_{elo}.json')

"""
Uploads champion stats data containing
a list of stat info for each champion

[champion] -> List[{tons of data}]

"""
def update_champion_stats(region: str, elo: str, unwanted_stats: Optional[List[str]] = None) -> None:
    # read matchid data
    if not (matchid_data := read_json(f'raw_data/matchid_{region}_{elo}.json')):
        print('matchid file not found')
        return
    
    if not unwanted_stats: 
        unwanted_stats = []

    # read champion_stats data
    stats_data = dict()

    # update stats data using all matches
    for i, matchid in enumerate(matchid_data, 1):
        try:
            champion_list = riot.request_champions_in_match(region, matchid)
            match_data = riot.request_match_data(region, matchid)
        except Exception as e:
            print(i, str(e))
            continue

        for participant_idx, champion in enumerate(champion_list):
            if champion not in stats_data.keys():
                stats_data[champion] = list()
            
            # filter data
            champ_data = match_data['info']['participants'][participant_idx]
            champ_data = {key:value for key, value in champ_data.items() if not key in unwanted_stats}
            
            stats_data[champion].append(champ_data)
        print(f"(Status, {i}): {matchid}")

    write_to_json(stats_data, f'raw_data/championstats_{region}_{elo}.json')

"""
Update champion ban rate for $region and $elo.

1. read all matches and count the number of times each champion was played

2. normalize by the number of read matches
"""
def update_ban_rate(region: str, elo: str) -> None:
    # read matchid data
    if not (matchid_data := read_json(f'raw_data/matchid_{region}_{elo}.json')):
        print('matchid file not found')
        return
    # ban data for each champ
    ban_data = dict()

    # champion id to champion name map
    id_to_name = riot.request_champions_id() 
    
    # read matches
    read_matches = 0
    for i, matchid in enumerate(matchid_data, 1):
        try:
            match_data = riot.request_match_data(region, matchid)
        except Exception as e:
            print(i, str(e))
            continue

        ban_list = [id_to_name[ban['championId']] for ban in (match_data['info']['teams'][0]['bans'] + match_data['info']['teams'][1]['bans']) if ban['championId'] != -1]
        
        # count champion
        for champion in ban_list:
            if champion not in ban_data.keys():
                ban_data[champion] = 0
            ban_data[champion] += 1 / len(matchid_data)

        read_matches += 1
        print(f"(Ban, {i}): {matchid}")

    # normalize
    assert(read_matches > 0)
    for champion in ban_data:
        ban_data[champion] /= read_matches

    write_to_json(ban_data, f'raw_data/championban_{region}_{elo}.json')


def main():
    regions = ["euw1", "eun1", "tr1", "ru", "br1", "na1", "la1", "la2", "kr", "jp1", "oc1", "ph2", "sg2", "th2", "tw2", "vn2"]
    elo = "challenger"
    for region in regions:
        update_matchid_list(region, elo)
        update_heatmap(region, elo)
        update_champion_stats(region, elo, unwanted_stats = []) # no filter
        update_ban_rate(region, elo)

if __name__ == "__main__":
    main()