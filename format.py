import json
import os

regions = ["euw1", "eun1", "tr1", "ru", "br1", "na1", "la1", "la2", "kr", "jp1", "oc1", "ph2", "sg2", "th2", "tw2", "vn2"]

def FormatStats(region, elo):
    matchID_path = f"raw_data/matchid_{region}_{elo}.json"   
    ban_path = f"raw_data/championban_{region}_{elo}.json"
    data_path = f"raw_data/championstats_{region}_{elo}.json"

    write_path = f"data/stats/stats_{region}_{elo}.json"

    with open(matchID_path, 'r') as json_file:
        matchID = json.load(json_file)

    with open(data_path, 'r') as json_file:
        data = json.load(json_file)
    
    with open(ban_path, 'r') as json_file:
        ban = json.load(json_file)

    attributes = {champion : {} for champion  in data}
    maxes = {}
    n_matches = len(matchID)

    # main data
    for champion in data:
        total = len(data[champion])
        championStats = {}
        for match in data[champion]: # array
            # add kda
            match['kda'] = (match['kills'] + match['assists']) / max(1, match['deaths'])

            # add dmg per gold
            match['damagePerGold'] = match['totalDamageDealt'] / max(1, match['goldEarned']) 
            
            # add (created) structure score
            match['structureScore'] = (5*match['nexusTakedowns'] + 3*match['inhibitorTakedowns'] + 2*match['turretTakedowns'])

            for stat in match:
                if not isinstance(match[stat], (int,float)): continue 
                if not stat in championStats:
                    championStats[stat] = 0
                championStats[stat] += match[stat] / total

        # add popularity
        championStats['popularity'] = len(data[champion])/n_matches

        # add ban
        championStats['ban'] = ban[champion] if champion in ban.keys() else 0
        
        attributes[champion] = championStats
    
    for champion in data:
        for stat in attributes[champion]:
            if not stat in maxes:
                maxes[stat] = 0
            maxes[stat] = max(maxes[stat], attributes[champion][stat])
    
    for champion in data:
        for stat in attributes[champion]:
            attributes[champion][stat] = {
                    'norm' : attributes[champion][stat] / maxes[stat] if maxes[stat] != 0 else attributes[champion][stat],
                    'abs' : attributes[champion][stat]}
    
    with open(write_path, 'w') as json_file:
        json.dump(attributes, json_file, indent=2)


def generateChampionList(region, elo):
    read_path = f"raw_data/championstats_{region}_{elo}.json"
    write_path = f"raw_data/championlist.json"

    with open(read_path, 'r') as json_file:
        data = json.load(json_file)

    if os.path.exists(write_path):
        with open(write_path, 'r') as json_file:
            championList = json.load(json_file)
    else: 
            championList = []

    
    championList = set(championList)

    for champion in data:
        championList.add(champion)

    championList = list(championList)
    with open(write_path, 'w') as json_file:
        json.dump(championList, json_file, indent=2)


# generateChampionList('br1', 'challenger')
for region in regions:
    FormatStats(region, 'challenger')
