from mega import Mega
import json

print('PYTHON: getaLink ran!')
mega = Mega()

master = mega.login('abjfark@knowledgemd.com', '1234@1234')

def fetchFileLink(name):
    # megaFileInstance = master.find(name + ".pdf")
    # print(megaFileInstance)
    return master.export(name + ".pdf")

f = open("./file.json", "r")
a = json.load(f)
fileName = a["fileKey"]
print("PYTHON: fileName acquired!", fileName)
f.close()


linkJson = {}
linkJson['linkKey'] = fetchFileLink(fileName)
print("PYTHON: linkJson is this:   ", linkJson)
with open('./link.json', 'w') as j:
    json.dump(linkJson, j)
    print("PYTHON: Wrote linkJson to link.json!")