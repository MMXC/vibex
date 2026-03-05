# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - link "← 返回首页" [ref=e4] [cursor=pointer]:
      - /url: /
    - heading "登录注册页" [level=1] [ref=e5]
    - paragraph
    - generic [ref=e6]:
      - heading "页面结构" [level=3] [ref=e7]
      - generic [ref=e8]: "{ \"layout\": { \"type\": \"flex\", \"rows\": \"1fr auto 1fr\" }, \"controls\": [ { \"id\": \"authCard\", \"type\": \"AuthCard\", \"position\": { \"x\": \"center\", \"y\": \"center\" }, \"size\": { \"width\": 400, \"height\": \"auto\" }, \"props\": {} } ] }"
    - generic [ref=e9]:
      - heading "控件列表" [level=3] [ref=e10]
      - generic [ref=e12]:
        - strong [ref=e13]: authCard
        - text: "-"
        - code [ref=e14]: AuthCard
        - generic [ref=e15]: "位置: {\"x\":\"center\",\"y\":\"center\"} | 尺寸: {\"width\":400,\"height\":\"auto\"}"
  - alert [ref=e16]
```