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

    write_to_json(list(matchid_list), f'data/matchid_{region}_{elo}.json')

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
    if not (matchid_data := read_json(f'data/matchid_{region}_{elo}.json')):
        print('matchid file not found')
        return
    
    # read heatmap data
    if not (heatmap_data := read_json(f'data/heatmap_{region}_{elo}.json')):
        heatmap_data = dict()
    
    # update heatmap data using all matches
    for i, matchid in enumerate(matchid_data, 1):
        update_heatmap_from_match(matchid, heatmap_data)
        print(i, matchid)

    write_to_json(heatmap_data, f'data/heatmap_{region}_{elo}.json')

"""
Uploads champion stats data containing
a list of stat info for each champion

[champion] -> List[{tons of data}]

"""
def update_champion_stats(region: str, elo: str, wanted_stats: List[str]) -> None:
    # read matchid data
    if not (matchid_data := read_json(f'data/matchid_{region}_{elo}.json')):
        print('matchid file not found')
        return
    # read champion_stats data
    # if not (stats_data := read_json(f'data/championstats_{region}_{elo}.json')):
        # stats_data = dict()
    stats_data = dict()

    # update stats data using all matches
    for i, matchid in enumerate(matchid_data, 1):
        champion_list = riot.request_champions_in_match(region, matchid)
        match_data = riot.request_match_data(region, matchid)

        for participant_idx, champion in enumerate(champion_list):
            if champion not in stats_data.keys():
                stats_data[champion] = list()
            
            # filter data
            champ_data = match_data['info']['participants'][participant_idx]
            champ_data = {key:value for key, value in champ_data.items() if key in wanted_stats}
            
            stats_data[champion].append(champ_data)
        print(i, matchid)

    write_to_json(stats_data, f'data/championstats_{region}_{elo}.json')

def update_ban_rate(region: str, elo: str) -> None:
    # read matchid data
    if not (matchid_data := read_json(f'data/matchid_{region}_{elo}.json')):
        print('matchid file not found')
        return
    # ban data for each champ
    ban_data = dict()

    # champion id to champion name map
    id_to_name = riot.request_champions_id() 
    
    for i, matchid in enumerate(matchid_data, 1):
        match_data = riot.request_match_data(region, matchid)
        ban_list = [id_to_name[ban['championId']] for ban in (match_data['info']['teams'][0]['bans'] + match_data['info']['teams'][1]['bans']) if ban['championId'] != -1]
        
        # count champion
        for champion in ban_list:
            if champion not in ban_data.keys():
                ban_data[champion] = 0
            ban_data[champion] += 1 / len(matchid_data)

        print(i, matchid)

    write_to_json(ban_data, f'data/championban_{region}_{elo}.json')


def main():
    update_heatmap('kr', 'challenger')

if __name__ == "__main__":
    main()


# wanted_stats = ['win', 'kills', 'deaths', 'assists', 'goldEarned', 'neutralMinionsKilled', 'timePlayed', 'visionScore', 'totalHealsOnTeammates', 'totalDamageDealt', 'timeCCingOthers', 'totalDamageTaken', 'baronKills', 'dragonKills', 'inhibitorKills', 'turretKills']
# combat_stats = ['kills', 'deaths', 'assists', 'timeCCingOthers', 'totalHealsOnTeammates', 'totalDamakeTaken', 'totalDamageDealt']
# income_control_stats = ['goldEarned', 'neutralMinionsKilled', 'timePlayed', 'visionScore', 'baronKills', 'dragonKills', 'turretKills', 'inhibitorKills']
# wanted_stats = combat_stats + income_control_stats
# update_champion_stats('euw1', 'challenger', wanted_stats = wanted_stats)
# update_ban_rate('br1', 'challenger')

# https://mobalytics.gg/blog/how-to-use-the-league-of-legends-stats-tab-to-improve/
# here we can find ideas for stats separated in combat / income / map control

# CHAMP LIST: (allow sorting by)
# --> Times played (prob. rate)
# --> game time
# --> total gold
# --> pick rate
# --> ban rate 
# --> win rate
# --> kda
# --> cs / min

# RADAR CHART: 
# 1. Combat:
#   --> kda ratio (kills + assists / deaths)
#   --> kill participation (kills + assists / total kills)
#   --> utility score (crowd control, team healing and team dmg red)
#   --> damage per death (total damage / deaths)
#   --> damage share (total damage / team total damage)


# 2. Income & Control:
#   --> damage per gold (total damage / total gold)
#   --> cs per minute
#   --> vision score
#   --> objectives (dragonKills, baronKills, turretKills, inhibitorKills)

# hard ...
#   --> early gold adv (gold at 15 min / oponent's gold at 15 min)
#   --> early cs adv (cs at 15 / oponent's cs at 15 min)
