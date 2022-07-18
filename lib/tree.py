from importlib.resources import path
from os import link
from mega import Mega

print('python file ran!')
mega = Mega()

master = mega.login('abjfark@knowledgemd.com', '1234@1234')




# file api dump parser
import json
from collections import deque

def parseApiOutput(data):
    files = []
    for key in reversed(data):
        entry = data[key]
        if entry['t'] == 0:
            path2 = entry['a']['n']
        else:
            path2 = entry['a']['n'] + '/'
        parentid = entry['p']
        fp = deque([path2])
        while parentid:
            parententry = data[parentid]
            parentname = parententry['a']['n']
            parentid = parententry['p']
            fp.appendleft(parentname)
        fp = '/'.join(fp)
        files.append(fp)
    files.sort()
    final = {}
    for item in files:
        keys = [i for i in item.split('/') if i.strip()]
        focus = final
        while keys:
            if keys[0] not in focus:
                if len(keys) > 1:
                    focus[keys[0]] = {keys[1]}
                else:
                    focus[keys[0]] = {}
            focus = focus[keys[0]]
            keys.pop(0)
    return json.dumps(final, indent=4)

#  get tree
filesApiDumpFromApi = master.get_files()
fileTree = parseApiOutput(filesApiDumpFromApi)

with open('./tree.json', 'w') as f:
    json.dump(fileTree, f)
