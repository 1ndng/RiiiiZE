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
    deleteLabel: "刪除",
    cancelLabel: "取消",
    // 鎖定畫面（輸入密碼前）：上方的字；KakaoTalk 有未讀訊息時會顯示通知，點了解鎖後直接打開那個聊天室
    swipeText: "滑動以解鎖",
    moreText: "還有 {n} 則通知"
  },

  /* ---------- 手機首頁 ---------- */
  home: {
    wallpaper: PH,
    // 上方的行事曆小工具：日期、月曆跟著現實的日期走；點月曆上的日期 → 左邊顯示那天的行程
    //   events = 行程：title = 文字、color = 顏色條、textColor = 文字顏色
    //   date 可寫 "10-1"（每年 10/1）、"2026-10-1"（只有那天）、"15"（每個月 15 號）、
    //        "星期五" 或 "fri"（每個星期五）；不寫 = 每天都顯示
    //   noEvents = 那天沒有行程時顯示的字（不寫 = 空白）
    //   想改顯示的字：weekdays（星期日～六）、months（一月～十二月）、weekHeads（一～日）
    calendar: {
      events: [
        { title: "boring-day", color: "#b36ad9", textColor: "#7b3f9e" },
        { title: "每月 15 號的行程", date: "15", color: "#ff9500" },
        { title: "星期五的行程", date: "星期五", color: "#34c759" }
      ]
    },
    // 行事曆下面的 App 圖示（有名稱；一排 4 個，照這裡的順序上到下、左到右排）
    icons: [
      { id: "photos", label: "相簿",      icon: "images/icon_photos.png" },
      { id: "notes",  label: "備忘錄",    icon: "images/icon_notes.png" },
      { id: "kakao",  label: "KakaoTalk", icon: "images/icon_kakao.png" },
      { id: "ig",     label: "Instagram", icon: "images/icon_insta.png" },
      { id: "x",      label: "X",         icon: "images/icon_x.png" }
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

  /* ---------- X ----------
   * me = 玩家用的帳號（左上角頭貼、回覆、發文都是這個帳號）
   * accounts：handle = @後面的 id、name、avatar、banner（封面）、bio、
   *   protected（鎖帳：沒跟隨就看不到貼文，按跟隨會變「已提出要求」）、followed（玩家一開始就有跟隨）、
   *   following / followers（顯示的數字；不寫 = 名單的人數）
   *   followingList / followersList：正在跟隨／跟隨者名單（點數字進去看）；寫 handle = 遊戲裡的帳號，
   *     寫 { handle, name, avatar, bio } = 路人（點不進去）。自己的「正在跟隨」會自動加上玩家跟隨中的帳號
   *   自己的帳號：玩家可以在「編輯個人資料」改名稱、簡介、保護你的貼文（不公開）；改成不公開／公開時記錄旗標
   *     x_private_帳號 / x_public_帳號
   *   likes / retweets：這個帳號按過喜歡／轉推的貼文 id（個人檔案的「喜歡」「轉推」分頁）；
   *   玩家自己的帳號不用寫，會顯示玩家按過的
   * tweets：照時間軸順序（新的在上面）
   *   id（不要重複）、by（誰發的）、text（@帳號、#標籤 會變藍色）、images（最多 4 張）、
   *   time（時間軸上的「1小時」）、date（內頁的「下午 12:32 · 2026/9/1」）、retweets、likes、
   *   liked / retweeted: true = 玩家一開始就按過、retweetedBy = 顯示「xxx 已轉推」
   *   replies：[{ by, text, time, replyTo, images }]；replyTo = 回覆誰（不寫 = 回覆發文的人），
   *     下一則回覆的是上一則的人時，兩則會用直線連起來（回覆串）
   */
  x: {
    me: "my_account",
    accounts: [
      { handle: "my_account", name: "我的帳號", avatar: PH, bio: "簡介",
        followersList: ["user_a", { handle: "passerby_1", name: "路人 1", avatar: PH, bio: "路人的簡介" }] },
      { handle: "user_a", name: "使用者 A", avatar: PH, banner: PH, followed: true,
        bio: "使用者 A 的簡介 #標籤", following: 120, followers: "1.2萬",
        followingList: ["my_account", "user_b", { handle: "passerby_1", name: "路人 1", avatar: PH }],
        followersList: ["user_b", { handle: "passerby_2", name: "路人 2" }],
        likes: ["t2"], retweets: [] },
      { handle: "user_b", name: "使用者 B", avatar: PH, protected: true, followed: true, bio: "鎖帳", following: 30, followers: 41,
        likes: ["t1", "t4"] },
      { handle: "user_c", name: "使用者 C", avatar: PH, protected: true, bio: "鎖帳（沒跟隨）", following: 8, followers: 9 }
    ],
    tweets: [
      { id: "t1", by: "user_a", text: "貼文內容\n第二行 @user_b #標籤", images: [PH], time: "1小時", date: "下午 12:32 · 2026/9/1",
        retweets: 18, likes: 457,
        replies: [
          { by: "user_b", text: "回覆 1", time: "6秒" },
          { by: "user_a", text: "回覆 2（回覆串）", time: "2秒", replyTo: "user_b" }
        ] },
      { id: "t2", by: "user_b", text: "鎖帳的貼文", time: "3小時", date: "上午 9:15 · 2026/9/1", likes: 4, liked: true },
      { id: "t3", by: "user_c", text: "看不到的貼文", time: "5小時", date: "上午 7:00 · 2026/9/1" },
      { id: "t4", by: "user_a", text: "多張照片", images: [PH, PH], time: "1天", date: "下午 8:00 · 2026/8/31", retweets: 2, likes: 30, retweetedBy: "user_b" }
    ]
    // 介面文字可以在 text: { … } 裡改（預設值寫在 js/apps/x.js 的 T_DEFAULT）
  },

  /* ---------- 備忘錄 ----------
   * notes：第一行 = 標題；date = "2026年1月1日"、time = "下午 3:20"
   *   pinned: true = 放在「已釘選」；locked: true = 要輸入 passcode 才看得到（解開時記錄旗標 note_備忘錄id）
   *   lockedTitle：鎖住時列表上顯示的標題（不寫 = 照樣顯示第一行）
   * 玩家可以直接改內容、新增、刪除（存在瀏覽器）
   */
  notes: {
    passcode: "0000",
    notes: [
      { id: "n1", text: "釘選的備忘錄\n第二行會顯示在列表上", date: "2026年1月1日", time: "上午 10:00", pinned: true },
      { id: "n2", text: "鎖住的備忘錄\n要輸入密碼才看得到", date: "2025年12月31日", time: "下午 11:00", locked: true },
      { id: "n3", text: "一般備忘錄\n內容", date: "2025年12月1日", time: "下午 3:20" }
    ]
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
    // 來電：達成 when 的旗標後過 delay 毫秒，room 這個好友打來（任何畫面都會跳出來；手機解鎖後才會響）
    //   ringFor = 響多久沒接就算未接（預設 30 秒）
    //   branch：依玩家有沒有在那個聊天室回過話，選開頭段落 { replied: "段落", notReplied: "段落" }；不寫 = 從 start 開始
    //   拒接或沒接 → 記錄 declineFlag，聊天室多一則未接來電
    // 例：{ id: "call1", when: "chat_f2", delay: 10000, room: "f2", declineFlag: "call1_declined",
    //       start: "s", nodes: { s: { lines: [{ who: "them", text: "…" }] } } }
    incoming: [
      { id: "demoCall", when: "chat_f2", delay: 6000, room: "f2",
        start: "s", nodes: { s: { lines: [{ who: "them", text: "來電測試" }, { who: "them", text: "掰掰" }] } } }
    ],
    noAnswerMs: 8000,              // 打給沒有劇本的好友，響多久後顯示「對方未接聽」
    friends: [
      {
        id: "f1",                     // 不要重複（用於網址）
        name: "好友 A",
        status: "",
        avatar: PH,
        unread: 1,                    // 一開始顯示的未讀數
        // 訊息種類：文字 text、照片 image、影片 video、語音通話 call: "voice"（duration 沒寫 = 未接；cancelled: true = 已取消）、
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
          { from: "them", call: "voice", time: "下午 9:10" },
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
        // 打給這個好友時的通話劇本（沒寫 = 打過去會「對方未接聽」）
        //   ringMs = 響多久才接
        //   也可以寫成清單 [ { flag: "旗標", … }, { … } ]：用第一個 flag 已達成（或沒寫 flag）的那個
        //   nodes 的格式：lines（who = "them" / "me"、text、sub）、choices（label、next、hangup、say: false）、
        //   flag（走到這段記錄旗標）、沒有 choices 的段落講完自動掛斷（waitMs、endFlag）
        call: {
          ringMs: 3000,
          start: "greet",
          nodes: {
            greet: {
              lines: [{ who: "them", text: "喂？", sub: "字幕下的小字" }],
              choices: [
                { label: "選項 A", next: "a" },
                { label: "選項 B（不說出口）", say: false, next: "b" },
                { label: "（直接掛斷）", hangup: true }
              ]
            },
            a: { lines: [{ who: "them", text: "選了 A" }, { who: "me", text: "玩家的話" }] },
            b: { lines: [{ who: "them", text: "選了 B" }], endFlag: "call_f1_done" }
          }
        },
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
      cancelledCall: "已取消",
      missedCall: "未接",
      yesterday: "昨天",
      now: "現在",
      linkNotice: "傳送了一條連結",
      meTag: "我"
    }
  }
};
