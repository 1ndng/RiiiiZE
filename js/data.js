/* =========================================================
 * 網頁上所有「顯示文字」與「圖片路徑」都集中在這個檔案。
 * 目前全部是測試用的佔位內容：照片都先用 images/placeholder.jpg，
 * 之後把文字、圖片路徑換成正式內容即可。
 * - 文字中的換行：在字串裡寫 \n。
 * - 影片：路徑寫 .mp4（限時動態、Kakao 都能放）；同名的 xxx_poster.jpg 會當作封面。
 * ========================================================= */
var PH = "images/placeholder.jpg";   // 佔位照片（全部先用同一張）

window.SITE_DATA = {

  /* ---------- 共用 ---------- */
  notUpdatedText: "尚未更新",   // 點到未開放功能時跳出的文字
  // IG 設定頁最下面的「重新開始」：清除所有進度、回到手機密碼鎖
  restartLabel: "重新開始",
  restartConfirm: "要清除所有進度、從頭開始嗎？",

  /* ---------- 手機密碼鎖（每次打開網址都要先輸入；留空 "" = 不鎖） ---------- */
  lock: {
    passcode: "0000",
    title: "輸入密碼",
    deleteLabel: "刪除"
  },

  /* ---------- 手機首頁 ---------- */
  home: {
    wallpaper: PH,
    // 上方的行事曆小工具：日期、月曆跟著現實的日期走
    //   events = 左邊顯示的行程（只顯示「今天」的）：title = 文字、color = 顏色
    //   date 可寫 "10-1"（每年 10/1）、"2026-10-1"（只有那天）、"fri"（每個星期五）；不寫 = 每天都顯示
    //   noEvents = 今天沒有行程時顯示的字（不寫 = 空白）
    //   想改成中文：weekdays（星期日～六）、months（1～12 月）、weekHeads（一～日）
    calendar: {
      events: [
        { title: "boring-day", color: "#b36ad9", textColor: "#7b3f9e" }
      ]
    },
    // Dock 上的 App（最多 4 個、不顯示名稱）
    apps: [
      { id: "ig",    label: "Instagram", icon: "images/icon_insta.png" },
      { id: "phone", label: "電話",      icon: "images/icon_phone.png" },
      { id: "kakao", label: "KakaoTalk", icon: "images/icon_kakao.png" },
      { id: "photos", label: "相簿",     icon: "images/icon_photos.png" }
    ]
  },

  /* ---------- Instagram ----------
   * 這一段本身 = 帳號「account_b」，同時放全部帳號共用的文字設定。
   * otherAccounts = 其他帳號；有寫 password 的可以從「新增帳號」登入。
   */
  instagram: {
    defaultAccount: "account_a",   // 打開 IG 時已經登入的帳號
    username: "account_b",
    password: "0000",              // 從「新增帳號」輸入對的帳號＋密碼才登得進去
    private: true,                 // 非公開帳號：沒追蹤的人看不到貼文、限時、名單
    avatar: "images/default_avatar.png",
    name: "",                      // 沒有名字 → 顯示帳號 id
    // 貼文數、粉絲、追蹤會自動計算；想顯示固定數字就加 postsCount / followersCount / followingCount
    closeFriendsList: [],
    following: ["account_a"],
    postsLabel: "貼文",
    followersLabel: "位粉絲",
    followingLabel: "追蹤中",
    bio: ["簡介第一行", "簡介第二行 @account_a"],   // @帳號 會變成連結
    music: { title: "歌名", artist: "歌手" },        // 個人頁音樂列；加 file: "audio/xxx.mp3" 才能播放
    saved: ["account_a/0"],        // 預先儲存的貼文（"帳號/貼文編號"，從 0 開始）
    editProfileLabel: "編輯個人檔案",
    shareProfileLabel: "分享個人檔案",
    // 精選動態：image = 圓圈封面，stories = 點進去看到的內容
    highlights: [
      { image: PH, label: "精選",
        stories: [
          // notes：好幾則留言輪流顯示，點一下打開全部（by 不寫 = 帳號主人自己）
          { image: PH, time: "1月1日", notes: [{ text: "留言 1" }, { text: "留言 2", by: "account_a" }] },
          { image: PH, time: "1月2日", note: "單則留言" }
        ] }
    ],
    posts: [
      { images: [PH], caption: "貼文內文", time: "1月2日" },
      { images: [PH, PH], caption: "多張照片的貼文（左右滑）", time: "1月1日" }
    ],
    reposts: [],

    // IG 互動時出現的文字（{user} 會自動換成帳號）
    text: {
      commentsTitle: "留言",
      commentPlaceholder: "為 {user} 新增留言……",
      postButton: "發佈",
      reply: "回覆",
      noComments: "還沒有留言",
      justNow: "剛剛",
      linkCopied: "已複製連結",
      reposted: "已轉發到你的個人檔案",
      unreposted: "已取消轉發",
      savedTitle: "已儲存",
      noSaved: "還沒有儲存任何貼文",
      noReposts: "還沒有轉發任何貼文",
      noTagged: "還沒有被標註的相片",
      storyMessageSent: "訊息已傳送",
      editTitle: "編輯個人檔案",
      nameLabel: "名稱",
      bioLabel: "個人簡介",
      cancelLabel: "取消",
      doneLabel: "完成",
      closeFriendsTitle: "摯友",
      noCloseFriends: "還沒有摯友",
      archiveTitle: "典藏",
      archiveStories: "限時動態",
      archivePosts: "貼文",
      noArchive: "沒有典藏的內容",
      privateTitle: "此帳號不公開",
      privateDesc: "追蹤這個帳號即可查看相片和影片。",
      requestedLabel: "已要求"
    },

    postTitle: "貼文",
    likedBySuffix: "說讚",
    storyMessagePlaceholder: "傳送訊息……",
    followLabel: "追蹤",
    followingButtonLabel: "追蹤中",

    // 右上角三條線 → 設定頁：已儲存、典藏、帳號隱私設定、摯友可以點進去；其他項目顯示「尚未更新」
    settings: {
      title: "設定和動態",
      sections: [
        { title: "功能", items: [
          { icon: "saved",   label: "已儲存" },
          { icon: "archive", label: "典藏" }
        ] },
        { title: "隱私", items: [
          { icon: "lock", label: "帳號隱私設定" },
          { icon: "star", label: "摯友" }
        ] }
      ]
    },

    addAccountLabel: "新增帳號",
    // 「新增帳號」的登入畫面（只在網頁內比對帳密，不會送出）
    login: {
      usernamePlaceholder: "帳號",
      passwordPlaceholder: "密碼",
      loginLabel: "登入",
      errorText: "帳號或密碼錯誤"
    },

    otherAccounts: [
      {
        username: "account_a",
        password: "0000",
        avatar: PH,
        name: "帳號 A",
        following: ["account_c"],
        // 粉絲／追蹤中名單：寫帳號 id = 遊戲裡的帳號（可點進去）；{ username, name, avatar } = 路人
        followersList: [
          "account_b",
          "account_c",
          { username: "passerby_1", name: "路人 1", avatar: PH },
          { username: "passerby_2", name: "路人 2" }
        ],
        followingList: [
          "account_c",
          { username: "passerby_1", name: "路人 1", avatar: PH }
        ],
        // 摯友名單：寫在這裡的帳號才看得到 closeFriends: true 的限時動態
        closeFriendsList: ["account_c", "passerby_1"],
        saved: [],
        // 典藏：stories = 過期的限時動態；posts = 下架的貼文
        archive: {
          stories: [
            { image: PH, time: "2025年12月31日" },
            { image: PH, time: "2025年12月31日", closeFriends: true }
          ],
          posts: [
            { images: [PH], caption: "典藏的貼文", time: "2025年12月1日" }
          ]
        },
        bio: ["帳號 A 的簡介"],
        music: { title: "歌名", artist: "歌手" },
        // 目前的限時動態（頭像外圈）
        story: [
          { image: PH, time: "1小時" },
          { image: PH, time: "30分鐘", closeFriends: true, likedBy: ["account_c"] }
        ],
        highlights: [
          { image: PH, label: "精選 1",
            stories: [
              { image: PH, time: "2025年12月1日" },
              { image: PH, time: "2025年12月2日", note: "限動留言", pos: "50% 50%" }
            ] },
          { image: PH, label: "精選 2", stories: [{ image: PH, time: "2025年12月3日" }] }
        ],
        posts: [
          {
            images: [PH, PH, PH],
            caption: "貼文內文\n第二行",
            time: "1月3日",
            likedBy: { name: "account_c" },   // 「account_c 說讚」
            comments: [
              { user: "account_c", text: "留言", time: "1天" },
              { user: "passerby_1", avatar: PH, text: "路人的留言", time: "1天" }
            ],
            tagged: ["account_c"]
          },
          { images: [PH], caption: "", time: "1月2日" },
          { images: [PH], caption: "", time: "1月1日" }
        ],
        reposts: []
      },
      {
        username: "account_c",
        password: "0000",
        avatar: PH,
        name: "帳號 C",
        following: ["account_a"],
        closeFriendsList: ["account_a"],
        bio: ["帳號 C 的簡介"],
        highlights: [],
        posts: [
          { images: [PH], caption: "帳號 C 的貼文", time: "1月1日" }
        ],
        reposts: ["account_a/1"]   // 轉發的貼文（"帳號/貼文編號"）
      }
    ],
    // 只能從名單點進去看、不能登入的帳號（不寫 password）
    searchOnlyAccounts: []
  },

  /* ---------- 電話（數字鍵盤） ---------- */
  phone: {
    // 可以接通的號碼；不在清單裡的號碼一樣能撥，但只會「無人接聽」
    // script.nodes 裡每一段有 lines（逐句字幕）和 choices（選項）
    //   lines：who = "them" 對方 / "me" 玩家；text = 字幕；sub = 字幕下的小字（例如翻譯）
    //   choices：label = 按鈕文字；next = 接到哪一段；hangup: true = 直接掛斷；say: false = 不顯示成玩家說的話
    //   flag = 走到這段時記錄的旗標；沒有 choices 的段落講完就自動掛斷（waitMs = 等多久、endFlag = 掛斷時記錄的旗標）
    dialable: [
      {
        number: "0000",
        name: "測試",               // 沒寫 name → 只顯示號碼
        script: {
          start: "greet",
          nodes: {
            greet: {
              lines: [
                { who: "them", text: "對方的第一句", sub: "字幕下的小字" }
              ],
              choices: [
                { label: "選項 A", next: "a" },
                { label: "選項 B（不說出口）", say: false, next: "b" },
                { label: "（直接掛斷）", hangup: true }
              ]
            },
            a: { lines: [{ who: "them", text: "選了 A" }, { who: "me", text: "玩家的話" }] },
            b: { lines: [{ who: "them", text: "選了 B" }] }
          }
        }
      }
    ],
    // 來電：達成 when 的旗標後過 delay 毫秒打來（手機解鎖後才會響）
    //   branch：依玩家有沒有在 room 這個 Kakao 聊天室回過話，選開頭段落（replied / notReplied）
    //   拒接或沒接 → 記錄 declineFlag，並在 room 的聊天室留下未接來電
    // 例：
    // { id: "call1", when: "login_account_b", delay: 10000,
    //   name: "好友 A", avatar: PH, label: "KakaoTalk 語音通話",
    //   declineFlag: "call1_declined",
    //   branch: { room: "f1", replied: "r1", notReplied: "n1" },
    //   nodes: { r1: { lines: [{ who: "them", text: "…" }] }, n1: { lines: [{ who: "them", text: "…" }] } } }
    incoming: [],
    acceptLabel: "接聽",
    declineLabel: "拒絕",
    endedText: "通話結束",
    callingText: "正在撥號⋯",
    noAnswerText: "無人接聽",
    callButtons: ["靜音", "鍵盤", "擴音", "加入通話", "FaceTime", "聯絡人"],
    endLabel: "結束"
  },

  /* ---------- 相簿（iPhone「照片」風格） ----------
   * photos：所有照片，照時間「舊 → 新」排（圖庫最下面是最新的）；每張的編號 = 在這個清單的位置（從 0 開始）
   *   image = 圖片或影片路徑（.mp4 = 影片，再寫 duration: "0:15" 顯示長度）
   *   date = "2026年1月1日"（年／月分組用）、time = "下午 3:20"、place = 地點、device = 拍攝裝置、caption = 說明
   *   favorite: true = 預設在「個人收藏」；hidden: true = 只在「已隱藏」相簿
   * albums：自己建的相簿（photos 寫照片編號）
   * hiddenPasscode：打開「已隱藏」相簿要輸入的密碼（留空 "" = 不鎖）；解開時記錄旗標 photos_hidden_unlocked
   */
  photos: {
    hiddenPasscode: "0000",
    photos: [
      { image: PH, date: "2025年6月1日", time: "上午 10:12", place: "地點 A" },
      { image: PH, date: "2025年6月1日", time: "上午 10:15" },
      { image: PH, date: "2025年8月20日", time: "下午 6:40", favorite: true },
      { image: PH, date: "2025年12月24日", time: "下午 8:03", place: "地點 B", caption: "照片說明" },
      { image: PH, date: "2025年12月31日", time: "下午 11:59", hidden: true },
      { image: PH, date: "2026年1月1日", time: "上午 12:00", favorite: true },
      { image: PH, date: "2026年1月1日", time: "上午 9:30", device: "iPhone" },
      { image: PH, date: "2026年1月1日", time: "下午 2:45" }
    ],
    albums: [
      { id: "a1", name: "相簿 1", photos: [0, 1, 3] },
      { id: "a2", name: "相簿 2", photos: [5, 6, 7] }
    ]
    // 介面文字可以在 text: { … } 裡改（預設值寫在 js/apps/photos.js 的 T_DEFAULT）
  },

  /* ---------- KakaoTalk ---------- */
  kakao: {
    passcode: "0000",              // 進入 KakaoTalk 的密碼；留空 "" = 不用密碼
    today: "2026年1月1日",          // 遊戲裡的「今天」（聊天列表顯示「昨天」、日期用）
    // 나와의 채팅（自己傳給自己）
    me: {
      name: "我",
      avatar: PH,
      messages: [
        { date: "2025年12月1日" },
        { from: "me", text: "自己的筆記", time: "下午 11:33" }
      ]
    },
    // 即時訊息：達成 when 的旗標後，過 delay 毫秒對方傳來（會跳通知橫幅）
    //   when 可寫一個旗標或陣列（全部達成）；unlessReplied: true = 玩家在那個聊天室回過話就不傳
    //   unless = 有這個旗標就不傳；unlessSent = 某則即時訊息已傳過就不傳
    //   常用旗標：phone_unlocked（解鎖手機）、kakao_unlocked、chat_聊天室id、login_帳號、public_帳號
    live: [
      { id: "demo1", when: "phone_unlocked", delay: 8000, room: "f1", text: "即時訊息測試" }
    ],
    friends: [
      {
        id: "f1",                     // 不要重複（用於網址）
        name: "好友 A",
        status: "",
        avatar: PH,
        unread: 1,                    // 一開始顯示的未讀數
        // 訊息種類：文字 text、照片 image、影片 video、通話 call: "video"/"voice"（duration 沒寫 = 未接）、
        // 收回 recalled: true、過期照片 expired: true、過期影片 expired: "video"、連結 link（＋ linkTitle、linkSite）
        // read: true = 對方已讀（我傳的訊息旁不顯示 1）
        messages: [
          { date: "2025年12月30日" },
          { from: "them", text: "文字訊息", time: "下午 8:34" },
          { from: "me", image: PH, time: "下午 8:48" },
          { from: "me", text: "我傳的訊息", time: "下午 8:48" },
          { from: "them", expired: true, time: "下午 8:50" },
          { from: "them", recalled: true, time: "下午 8:51" },
          { from: "me", call: "voice", duration: "3:21", time: "下午 9:00" },
          { from: "them", call: "video", time: "下午 9:10" },
          { date: "2025年12月31日" },
          { from: "them", link: "https://example.com", linkTitle: "連結標題", linkSite: "example.com", time: "上午 10:00" },
          { from: "me", text: "最後一則", time: "上午 10:05" }
        ],
        // 關鍵字自動回覆：玩家傳的訊息「包含」任一個 keywords 就回 reply（可多句，依序送出）
        //   flag = 達成這個旗標後才有效；exclude = 包含這些字就不算；keywords 留空 = 任何訊息都算
        //   read: true = 秒讀；typing: [毫秒, 毫秒…] = 「輸入中」顯示／消失輪流
        replies: [
          { keywords: ["你好", "hi"], read: true, typing: [1500], reply: ["你好！"] }
        ],
        defaultReply: []              // 沒有符合任何關鍵字時的回覆；空的 = 不回
      },
      {
        id: "f2",
        name: "好友 B",
        status: "",
        avatar: PH,
        unread: 0,
        messages: [
          { date: "2025年12月1日" },
          { from: "me", text: "訊息", time: "下午 4:24" },
          { from: "them", text: "訊息", time: "下午 4:30" }
        ],
        replies: [],
        defaultReply: ["自動回覆"]
      },
      {
        id: "f3",
        name: "好友 C",
        status: "",
        avatar: PH,
        unread: 0,
        messages: [],
        replies: [],
        defaultReply: []
      }
    ],
    // 群組：members 寫好友 id；訊息的 from 寫好友 id（或 "me"）；name 留空 = 自動用成員名字
    // replies 的 reply 可以寫 { from: "f3", text: "..." } 指定誰回
    groups: [
      {
        id: "g1",
        name: "",
        members: ["f2", "f3"],
        unread: 0,
        messages: [
          { date: "2025年11月1日" },
          { from: "f2", text: "群組訊息", time: "下午 10:07" },
          { from: "me", text: "我的訊息", time: "下午 10:13" },
          { from: "f3", image: PH, time: "下午 10:16" }
        ],
        replies: [],
        defaultReply: []
      }
    ],
    // 介面文字
    text: {
      lockTitle: "輸入密碼",
      lockHint: "請輸入密碼。",
      lockDelete: "刪除",
      chatsTitle: "聊天",
      inputPlaceholder: "輸入訊息",
      ampm: ["上午", "下午"],
      photoLabel: "照片",
      videoLabel: "影片",
      recalledText: "已收回訊息",
      expiredText: "照片已過期",
      expiredVideoText: "影片已過期",
      voiceCall: "語音通話",
      videoCall: "視訊通話",
      missedCall: "未接",
      yesterday: "昨天",
      now: "現在",
      linkNotice: "傳送了一條連結",
      meTag: "我"
    }
  }
};
