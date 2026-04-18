class Baozi extends ComicSource {
    // 此漫画源的名称
    name = "包子漫画"

    // 唯一标识符
    key = "baozi"

    version = "1.3.0"

    minAppVersion = "4.0.0"

    // 更新链接
    url = "https://raw.githubusercontent.com/2936410488/pica_configs/master/baozi.js"

    /// APP启动时或者添加/更新漫画源时执行此函数
    init() {}

    /// 账号
    /// 设置为null禁用账号功能
    account = {
        /// 登录
        /// 返回任意值表示登录成功
        login: async (account, pwd) => {
            let res = await Network.post("https://cn.baozimh.com/api/bui/signin", {
                'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryFUNUxpOwyUaDop8s'
            }, "------WebKitFormBoundaryFUNUxpOwyUaDop8s\r\nContent-Disposition: form-data; name=\"username\"\r\n\r\n" + account + "\r\n------WebKitFormBoundaryFUNUxpOwyUaDop8s\r\nContent-Disposition: form-data; name=\"password\"\r\n\r\n" + pwd + "\r\n------WebKitFormBoundaryFUNUxpOwyUaDop8s--\r\n")
            if(res.status !== 200) {
                throw "Invalid status code: " + res.status
            }
            let json = JSON.parse(res.body)
            let token = json.data
            Network.setCookies(this.baseUrl, [
                Cookie('TSID', token, '.baozimh.com'),
            ])
            return 'ok'
        },

        // 退出登录时将会调用此函数
        logout: () => {
            Network.deleteCookies('.baozimh.com')
        },

        registerWebsite: `https://cn.baozimh.com/user/signup`
    }

    lang = 'cn'

    get baseUrl(){
        return `https://${this.lang}.baozimh.com`
    }

    parseComic(e) {
        let url = e.querySelector("a").attributes['href']
        let id = url.split("/").pop()
        let title = e.querySelector("h3").text.trim()
        let cover = e.querySelector("a > amp-img").attributes["src"]
        let tags = e.querySelectorAll("div.tabs > span").map(e => e.text.trim())
        let description = e.querySelector("small").text.trim()
        return {
            id: id,
            title: title,
            cover: cover,
            tags: tags,
            description: description
        }
    }

    parseJsonComic(e) {
        return {
            id: e.comic_id,
            title: e.name,
            subTitle: e.author,
            cover: `https://static-tw.baozimh.com/cover/${e.topic_img}?w=285&h=375&q=100`,
            tags: e.type_names,
        }
    }

    /// 探索页面
    /// 一个漫画源可以有多个探索页面
    explore = [
        {
            /// 标题
            /// 标题同时用作标识符, 不能重复
            title: "包子漫画",

            /// singlePageWithMultiPart 或者 multiPageComicList
            type: "singlePageWithMultiPart",

            load: async () => {
                var res = await Network.get(this.baseUrl)
                if (res.status !== 200) {
                    throw "Invalid status code: " + res.status
                }
                let document = new HtmlDocument(res.body)
                let parts = document.querySelectorAll("div.index-recommend-items")
                let result = {}
                for (let part of parts) {
                    let title = part.querySelector("div.catalog-title").text.trim()
                    let comics = part.querySelectorAll("div.comics-card").map(e => this.parseComic(e))
                    if(comics.length > 0) {
                        result[title] = comics
                    }
                }
                return result
            }
        }
    ]

    /// 分类页面
    /// 一个漫画源只能有一个分类页面, 也可以没有, 设置为null禁用分类页面
    category = {
        /// 标题, 同时为标识符, 不能与其他漫画源的分类页面重复
        title: "包子漫画",
        parts: [
            {
                name: "类型",

                // fixed 或者 random
                // random用于分类数量相当多时, 随机显示其中一部分
                type: "fixed",

                // 如果类型为random, 需要提供此字段, 表示同时显示的数量
                // randomNumber: 5,

                categories: ['全部', '恋爱', '纯爱', '古风', '异能', '悬疑', '剧情', '科幻', '奇幻', '玄幻', '穿越', '冒险', '推理', '武侠', '格斗', '战争', '热血', '搞笑', '大女主', '都市', '总裁', '后宫', '日常', '韩漫', '少年', '其它'],

                // category或者search
                // 如果为category, 点击后将进入分类漫画页面, 使用下方的`categoryComics`加载漫画
                // 如果为search, 将进入搜索页面
                itemType: "category",

                // 若提供, 数量需要和`categories`一致, `categoryComics.load`方法将会收到此参数
                categoryParams: ['all', 'lianai', 'chunai', 'gufeng', 'yineng', 'xuanyi', 'juqing', 'kehuan', 'qihuan', 'xuanhuan', 'chuanyue', 'mouxian', 'tuili', 'wuxia', 'gedou', 'zhanzheng', 'rexie', 'gaoxiao', 'danuzhu', 'dushi', 'zongcai', 'hougong', 'richang', 'hanman', 'shaonian', 'qita']
            }
        ],
        enableRankingPage: false,
    }

    /// 分类漫画页面, 即点击分类标签后进入的页面
    categoryComics = {
        load: async (category, param, options, page) => {
            let res = await Network.get(`${this.baseUrl}/api/bzmhq/amp_comic_list?type=${param}&region=${options[0]}&state=${options[1]}&filter=%2a&page=${page}&limit=36&language=${this.lang}&__amp_source_origin=https%3A%2F%2F${this.lang}.baozimh.com`)
            if (res.status !== 200) {
                throw "Invalid status code: " + res.status
            }
            let maxPage = null
            let json = JSON.parse(res.body)
            if(!json.next) {
                maxPage = page
            }
            return {
                comics: json.items.map(e => this.parseJsonComic(e)),
                maxPage: maxPage
            }
        },
        // 提供选项
        optionList: [
            {
                options: [
                    "all-全部",
                    "cn-国漫",
                    "jp-日本",
                    "kr-韩国",
                    "en-欧美",
                ],
            },
            {
                options: [
                    "all-全部",
                    "serial-连载中",
                    "pub-已完结",
                ],
            },
        ],
    }

    /// 搜索
    search = {
        load: async (keyword, options, page) => {
            let res = await Network.get(`https://cn.bzmgcn.com/search?q=${keyword}`)
            if (res.status !== 200) {
                throw "Invalid status code: " + res.status
            }
            let document = new HtmlDocument(res.body)
            let comics = document.querySelectorAll("div.comics-card").map(e => this.parseComic(e))
            return {
                comics: comics,
                maxPage: 1
            }
        },

        // 提供选项
        optionList: []
    }

    /// 收藏
    favorites = {
        /// 是否为多收藏夹
        multiFolder: false,
        /// 添加或者删除收藏
        addOrDelFavorite: async (comicId, folderId, isAdding) => {
            if(!isAdding) {
                let res = await Network.post(`${this.baseUrl}/user/operation_v2?op=del_bookmark&comic_id=${comicId}`)
                if (!res.status || res.status >= 400) {
                    throw "Invalid status code: " + res.status
                }
                return 'ok'
            } else {
                let res = await Network.post(`${this.baseUrl}/user/operation_v2?op=set_bookmark&comic_id=${comicId}&chapter_slot=0`)
                if (!res.status || res.status >= 400) {
                    throw "Invalid status code: " + res.status
                }
                return 'ok'
            }
        },
        // 加载收藏夹, 仅当multiFolder为true时有效
        // 当comicId不为null时, 需要同时返回包含该漫画的收藏夹
        loadFolders: null,
        /// 加载漫画
        loadComics: async (page, folder) => {
            let res = await Network.get(`${this.baseUrl}/user/my_bookshelf`)
            if (res.status !== 200) {
                throw "Invalid status code: " + res.status
            }
            let document = new HtmlDocument(res.body)
            function parseComic(e) {
                let title = e.querySelector("h4 > a").text.trim()
                let url = e.querySelector("h4 > a").attributes['href']
                let id = url.split("/").pop()
                let author = e.querySelector("div.info > ul").children[1].text.split("：")[1].trim()
                let description = e.querySelector("div.info > ul").children[4].children[0].text.trim()

                return {
                    id: id,
                    title: title,
                    subTitle: author,
                    description: description,
                    cover: e.querySelector("amp-img").attributes['src']
                }
            }
            let comics = document.querySelectorAll("div.bookshelf-items").map(e => parseComic(e))
            return {
                comics: comics,
                maxPage: 1
            }
        }
    }

    /// 单个漫画相关
    comic = {
        // 加载漫画信息
        loadInfo: async (id) => {
            let res = await Network.get(`${this.baseUrl}/comic/${id}`)
            if (res.status !== 200) {
                throw "Invalid status code: " + res.status
            }
            let document = new HtmlDocument(res.body)

            // 获取标题，带空值检查
            let titleElement = document.querySelector("h1.comics-detail__title")
            let title = titleElement ? titleElement.text.trim() : "未知标题"
            
            // 获取封面
            let coverElement = document.querySelector("div.l-content > div > div > amp-img")
            let cover = coverElement ? coverElement.attributes['src'] : ""
            
            // 获取作者
            let authorElement = document.querySelector("h2.comics-detail__author")
            let author = authorElement ? authorElement.text.trim() : "未知作者"
            
            // 获取标签
            let tags = []
            let tagElements = document.querySelectorAll("div.tag-list > span")
            if (tagElements && tagElements.length > 0) {
                tags = tagElements.map(e => e.text.trim())
            }
            
            // 获取更新时间，带空值检查
            let updateTime = ""
            let updateTimeElement = document.querySelector("div.supporting-text > div > span > em")
            if (updateTimeElement) {
                updateTime = updateTimeElement.text.trim().replace('(', '').replace(')', '')
            } else {
                // 尝试其他选择器
                let altUpdateElement = document.querySelector(".supporting-text em")
                if (altUpdateElement) {
                    updateTime = altUpdateElement.text.trim().replace('(', '').replace(')', '')
                }
            }
            
            // 获取描述
            let descElement = document.querySelector("p.comics-detail__desc")
            let description = descElement ? descElement.text.trim() : ""
            
            let chapters = new Map()
            let i = 0
            
            // 方法1: 优先尝试获取完整章节目录 #chapter-items
            let chapterItems = document.querySelectorAll("#chapter-items > div.comics-chapters > a > div > span")
            
            // 方法2: 尝试获取 #chapters_other_list
            let otherChapterItems = document.querySelectorAll("#chapters_other_list > div.comics-chapters > a > div > span")
            
            // 方法3: 如果以上都没有，从最新章节区域获取（处理章节数量少的情况）
            let latestChapters = []
            if (chapterItems.length === 0 && otherChapterItems.length === 0) {
                // 尝试从最新章节区域获取章节列表
                latestChapters = document.querySelectorAll(".l-box .pure-g .comics-chapters .comics-chapters__item > div > span")
                
                if (latestChapters.length === 0) {
                    latestChapters = document.querySelectorAll(".comics-chapters__item > div > span")
                }
                
                if (latestChapters.length === 0) {
                    let chapterLinks = document.querySelectorAll(".comics-chapters__item")
                    for (let link of chapterLinks) {
                        let span = link.querySelector("div > span")
                        if (span) {
                            latestChapters.push(span)
                        }
                    }
                }
            }
            
            // 添加完整目录的章节
            for(let c of chapterItems) {
                chapters.set(i.toString(), c.text.trim())
                i++
            }
            
            // 添加 other 章节
            for(let c of otherChapterItems) {
                chapters.set(i.toString(), c.text.trim())
                i++
            }
            
            // 如果没有找到完整目录，则使用最新章节区域的数据
            if (chapterItems.length === 0 && otherChapterItems.length === 0) {
                for(let c of latestChapters) {
                    chapters.set(i.toString(), c.text.trim())
                    i++
                }
            }
            
            // 如果还是没有章节，尝试从页面其他地方获取
            if (chapters.size === 0) {
                // 尝试获取所有章节链接的文本
                let allChapterSpans = document.querySelectorAll(".comics-chapters a div span")
                for(let c of allChapterSpans) {
                    chapters.set(i.toString(), c.text.trim())
                    i++
                }
            }
            
            let recommend = []
            let recommendItems = document.querySelectorAll("div.recommend--item")
            for(let c of recommendItems) {
                if(c.querySelectorAll("div.tag-comic").length > 0) {
                    let titleSpan = c.querySelector("span")
                    let coverImg = c.querySelector("amp-img")
                    let link = c.querySelector("a")
                    if (titleSpan && coverImg && link) {
                        let recTitle = titleSpan.text.trim()
                        let recCover = coverImg.attributes['src']
                        let url = link.attributes['href']
                        let recId = url.split("/").pop()
                        recommend.push({
                            id: recId,
                            title: recTitle,
                            cover: recCover
                        })
                    }
                }
            }

            return {
                title: title,
                cover: cover,
                description: description,
                tags: {
                    "作者": [author],
                    "更新": updateTime ? [updateTime] : [],
                    "标签": tags
                },
                chapters: chapters,
                recommend: recommend
            }
        },
        // 获取章节图片
        loadEp: async (comicId, epId) => {
            let res = await Network.get(`https://${this.lang}.czmanga.com/comic/chapter/${comicId}/0_${epId}.html`)
            if (res.status !== 200) {
                throw "Invalid status code: " + res.status
            }
            let document = new HtmlDocument(res.body)
            let images = document.querySelectorAll("ul.comic-contain > div > amp-img").map(e => e.attributes['src'])
            console.log(images)
            return {
                images: images
            }
        },
    }
}
