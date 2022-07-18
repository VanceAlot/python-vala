from os import link
from mega import Mega

mega = Mega()

master = mega.login('abjfark@knowledgemd.com', '1234@1234')
tempAcc = mega.login()

def anonymizeALink(link, folderName):
    if(folderName == None):
        folderName = 'temporary'
    tempAcc.import_public_url(link, dest_node=folderName[1])
    return tempAcc.export(folderName)

def uploadInput(input, folderName): #imports link in master and anonymizes it
    if(input is str):
        master.import_public_url(input, dest_node=folderName[1])
    else:
        master.import_public_file(input, dest_node=folderName[1])
    
def fetchFileLink(name):
    folder = master.find(name)
    return anonymizeALink(master.export(folder))

# get files
filesApiDumpFromApi = master.get_files()
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

# aise kar lena
# fileTree = parseApiOutput(filesApiDumpFromApi)