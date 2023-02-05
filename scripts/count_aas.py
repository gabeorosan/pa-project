import json
import sys

def countlist(l):
    counts = dict()
    for i in l:
        counts[i] = counts.get(i, 0) + 1
    return counts

def letters(i):
    try:
        res = ''.join([c for c in i if c.isalpha()])
        return res
    except Exception as e:
        print(i)
aa_dict = {}

from pathlib import Path
directory = Path('vpa_input/').glob('*.pdb')

for file in directory:
    file = str(file)
    if 'full' not in file: continue
    pdb_id = file.split('.')[0]
    print(file)
    with open(file) as pdb_file:
        aas = []
        for l in pdb_file.readlines():
            aa = l[17:20]
            aa_alpha = letters(aa)
            aas.append(aa_alpha)
    aa_dict[pdb_id] = countlist(aas)
with open('aas.json', 'w') as f:
    json_str = json.dumps(aa_dict, indent=4)
    f.write(json_str)


