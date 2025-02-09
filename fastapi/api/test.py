import re

text = "家別\n上課日期與時間\n□加拿 □新武 ■霧鹿 □利稻 □電光"

# 允許 `■` 前後有空格，並確保 `■` 旁邊的是家別名稱
team_match = re.search(r'■\s*(加拿|新武|霧鹿|利稻|電光)', text)

team = team_match.group(1) if team_match else ""

print(team)  # 應該輸出 "霧鹿"