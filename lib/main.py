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

# upload to folder and rename
f = open("./pdfData.json", "r")
pdfData = json.load(f)
f.close()

if pdfData['type'] == "assignment" :
    pdfData['type'] = "assignments"


folder = master.find(pdfData['type'] + "-" + pdfData['subject'])
print(pdfData['type'] + "-" + pdfData['subject'])
print(folder)
print(folder[0])
file = master.upload("./undefined.pdf", folder[0])
print("Successfully Uploaded!")

fileInstanceOnMega = master.find('undefined.pdf')
print(fileInstanceOnMega)
master.rename(fileInstanceOnMega, pdfData['name'] + '.pdf')
print('Successfully Renamed!')