from mega import Mega
import json
# import sys
# print(sys.argv)

# dataMechanical = {
#     "Workshop" : "",
# }


mega = Mega()
master = mega.login('abjfark@knowledgemd.com', '1234@1234')

subFolder = ["assignments", "books", "notes", "pyq", "misc" ]
def createFolders(data):
    for i in data:
        i = i.lower()
        print('created ' + i)
        for j in subFolder:
            j = j.lower()
            subFolderName = j + "-" + i
            master.create_folder(i + "/" + subFolderName)
            print('created '+ subFolderName + ' in ' + i)

f = open("./generate.json", "r")
generateData = json.load(f)
f.close()


createFolders(generateData)