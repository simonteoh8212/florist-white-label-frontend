export type Locale = "en" | "zh";

export const translations = {
  en: {
    // Header & Announcement
    announcement: "Same-Day Delivery & Pickup Available",
    chat: "Chat",
    chatAria: "Chat with {store} on WhatsApp",

    // Hero Section
    artisanalCollection: "Artisanal Collection",
    heroSubtitle: "Curated Blooms For Life’s Most Beautiful Moments",
    heroDesc:
      "Order your floral arrangement, specify fulfillment details, and complete your order seamlessly with Touch 'n Go payment proof.",
    doorstepDelivery: "Doorstep Delivery",
    storePickup: "Store Pickup",
    selectedSlots: "Selected Slots",
    tngProof: "TNG eWallet Proof",

    // Search & Filter
    searchPlaceholder: "Search flowers, bouquets, balloons, roses...",
    clearSearch: "Clear search",
    allCategories: "All",
    floralCatalog: "Floral Catalog",
    pricesIn: "Prices in",
    sortByPrice: "Sort By Price",
    priceHighLow: "Price: High to Low",
    priceLowHigh: "Price: Low to High",
    resetDefault: "Reset to default",
    removeSorting: "Remove sorting",
    searchBadge: "Search",
    viewGrid: "Grid",
    viewList: "List",
    inStockOnly: "In Stock",
    hideSoldOut: "Hide Sold Out",

    // Empty State
    noArrangements: "No arrangements found",
    noArrangementsDesc:
      "We couldn't find any flowers matching \"{query}\". Try another keyword or browse our categories.",
    clearSearchFilters: "Clear Search & Filters",

    // Pagination
    showMore: "Show More Arrangements",
    showingCount: "Showing {count} of {total} items",

    // Store Pickup Notice
    atelierPickup: "Atelier Pickup",
    googleMaps: "Google Maps ↗",

    // Footer
    storePolicyTerms: "Store Policy & Terms",
    privacyNotice: "Privacy Notice (PDPA)",
    poweredBy: "Powered by flowerapp.my • Platform Provider",
    footerDisclaimer:
      "All orders, payments, fulfillment, and inquiries are handled directly by {store}.",
    scrollTop: "Scroll to top",

    // Product Card & Modal
    orderNow: "Order Now",
    viewPhoto: "View photo",
    featured: "Featured",
    orderThisArrangement: "Order This Arrangement",
    close: "Close",
    closeFullPicture: "Close full picture",
    freshArrangement: "Fresh Arrangement",
    back: "Back",
    orderNowPrice: "Order Now • {price}",

    // Checkout Drawer - Step 1
    fulfillmentAndDetails: "Fulfillment & Details",
    touchNGoPayment: "Touch 'n Go Payment",
    drawerOrderFor: "Order for {store} • Select delivery or pickup",
    drawerTngSubtitle: "Scan the TNG QR code and confirm via WhatsApp.",
    selectedArrangement: "Selected Arrangement",
    qty: "Qty: {count}",
    storePickupAddress: "{store} Pickup Address:",
    maps: "Maps ↗",
    fulfillmentDate: "Delivery / Pickup Date",
    today: "Today",
    todayClosed: "Today (Closed)",
    todayPaused: "Today (Paused)",
    tomorrow: "Tomorrow",
    tomorrowBlocked: "Tomorrow (Unavailable)",
    emergencyPauseNotice:
      "Same-day deliveries are temporarily paused today due to high order volume or emergency. Please choose tomorrow or a later date.",
    tomorrowBlockedNotice:
      "Deliveries for tomorrow are currently unavailable due to store capacity. Please choose another date.",
    preferredTimeSlot: "Preferred Time Slot",
    exactDeliveryTime: "Exact Delivery Time",
    pastSlotsHidden: "Past slots hidden",
    sameDayClosed: "Same-Day Deliveries Closed",
    sameDayClosedExact:
      "Same-day deliveries require {hours} hours notice before closing at {end}. Please select Tomorrow or a later date.",
    sameDayClosedRange:
      "All fulfillment slots for today have closed. Please select Tomorrow or a later date.",
    switchToTomorrow: "Switch to Tomorrow →",
    quickSelect: "Quick Select:",
    minPreparationNotice:
      "* Minimum {hours}h preparation time required (earliest today: {time}).",
    rushOrderTitle: "Same-Day Rush Delivery Slot",
    rushOrderNotice:
      "Order received during or close to delivery window. Our florists will do their best! Final delivery timing will be confirmed via WhatsApp.",
    rushBadge: "⚡ Rush",
    // Holiday Peak Surcharge & Capacity
    holidayPeakBadge: "Peak Holiday Season",
    holidayPeakNotice: "Wholesale fresh flowers experience seasonal market adjustments during peak holiday periods.",
    holidayCapacitySoldOut: "{holiday} is fully booked! We have reached maximum studio capacity for {date}.",
    suggestAlternativeDate: "We recommend choosing {altLabel} to secure fresh blooms!",
    switchToAltDate: "Switch to {altLabel} →",
    peakSurchargeLineItem: "Peak Holiday Surcharge ({holiday}):",
    holidayBroadWindowsNotice: "Broad delivery windows are in effect for {holiday} to ensure safe courier dispatch during peak road traffic.",
    holidayInclusiveBadge: "Holiday Seasonal Price",
    holidayDirectPriceNotice: "Product price reflects seasonal holiday market adjustments.",
    recipientContactDetails: "Recipient & Contact Details",
    recipientNamePlaceholder: "Recipient / Customer Name *",
    phonePlaceholder: "WhatsApp Phone Number *",
    addressPlaceholder:
      "Delivery Address (Unit/House No, Building, Street, Postcode, City) *",
    cardMessagePlaceholder:
      "Complimentary Greeting Card Message (e.g. 'Happy Birthday Dear! Wishing you joy ✨')",
    proceedToPayment: "Proceed to Payment",
    orderConsentNotice: "By ordering, you acknowledge our",
    substitutionStorePolicy: "Substitution & Store Policy",
    and: "and",
    privacyNoticePdpa: "Privacy Notice (PDPA)",
    closeDrawer: "Close drawer",

    // Checkout Drawer - Validation
    validationName: "Please enter your name.",
    validationPhone: "Please enter your WhatsApp contact number.",
    validationDate: "Please pick a delivery/pickup date.",
    validationPastDate: "Selected date cannot be in the past. Please select today or a future date.",
    validationTodayPaused: "Same-day orders are paused for today. Please pick tomorrow or a later date.",
    validationExactTime: "Please specify your preferred exact delivery time.",
    validationExactTimeAdvance:
      "Same-day orders require at least {hours}h advance notice (from {time} onwards).",
    validationExactTimeHours:
      "Please choose a delivery time within operating hours ({start} – {end}).",
    validationTimeSlot: "Please choose a preferred delivery time slot.",
    validationAddress: "Please enter your complete delivery address.",
    validationDeliveryZone: "Please select your delivery area / zone.",
    validationStoreClosedDate: "The store is closed on the selected date. Please pick an open date.",

    // Delivery Area & Add-ons
    deliveryArea: "Delivery Area / Zone",
    selectDeliveryArea: "Select delivery area / zone *",
    deliveryFee: "Delivery Fee",
    freeDelivery: "FREE Delivery",
    freeDeliveryThresholdNote: "Free delivery on orders {threshold} and above!",
    freeDeliveryApplied: "FREE (Promo Applied)",
    enhanceYourGift: "Enhance Your Gift",
    enhanceYourGiftSubtitle: "Add thoughtful extras to make the moment unforgettable",
    selectedCount: "{count} selected",
    subtotal: "Bouquet Subtotal",
    addonsTotal: "Add-ons",
    orderTotal: "Order Total",
    storeClosedDayWarning:
      "Store is closed on this date ({reason}). Please select another date.",
    regularWeeklyClosed: "Weekly Rest Day",
    holidayBlackoutClosed: "Holiday / Special Blackout Date",

    // Checkout Drawer - Step 2 (TngPaymentView)
    editOrderDetails: "Edit Order Details",
    proofVerification: "Proof Verification",
    instantGatewayVerification: "Instant Gateway Verification",
    totalPayableAmount: "Total Payable Amount",
    copy: "Copy",
    copied: "Copied!",
    arrangement: "Arrangement:",
    amountCopiedBanner:
      "Amount {amount} copied! Ready to paste into your eWallet.",
    tngAutomatedGateway: "Touch 'n Go Automated Gateway",
    redirectGatewayDesc:
      "You will be redirected directly to the Touch 'n Go checkout for {store}.",
    payViaTng: "Pay {amount} via Touch 'n Go",
    openTngApp: "Open Touch 'n Go eWallet App",
    openTngAppSubtitle: "Copies {amount} & launches TNG App",
    openingTngHelper:
      "Opening Touch 'n Go... If app didn't open automatically, scan QR below.",
    orScanQr: "Or Scan Payment QR Code",
    accountLabel: "Account:",
    viewQrFullscreen: "View QR Fullscreen",
    howToCompleteOrder: "How to complete order",
    step1Guide:
      "Tap \"Open Touch 'n Go eWallet App\" above (amount is copied).",
    step2Guide:
      "Transfer {amount} & take a screenshot of your receipt.",
    step3Guide:
      "Tap below to send your order details & receipt proof via WhatsApp!",
    confirmSendWhatsapp: "Confirm & Send WhatsApp",
    whatsappHelperText:
      "Your WhatsApp will open with a pre-filled order summary ready to attach your payment receipt.",

    // Policy Modal
    policyModalTitle: "Store Policy & Terms",
    sec1Title: "1. Flower & Foliage Substitution Policy",
    sec1Desc:
      "Fresh flowers are natural seasonal products. Stems, blooms, and wrapping materials are subject to daily market availability.",
    sec1Bullet1:
      "In the event that specific flowers are unavailable, our artisan florists will substitute them with blooms of equal or greater value.",
    sec1Bullet2:
      "We will faithfully preserve the bouquet's overall color palette, aesthetic, and style.",
    sec2Title: "2. Delivery & Fulfillment Terms",
    sec2Desc1:
      "Delivery Windows: We make every effort to deliver within your selected preferred slot. However, unforeseen road conditions, bad weather, or festive traffic may cause slight variations.",
    sec2Desc2:
      "Recipient Unreachable: If the recipient cannot be contacted and no one is available to receive the delivery, our driver may leave the arrangement in a safe spot (security guardhouse / concierge) with photo proof, or return it to our atelier. A re-delivery fee will apply for subsequent attempts.",
    sec2Desc3:
      "Delivery Fees: Standard delivery fees are calculated based on travel distance from our atelier and will be confirmed via WhatsApp.",
    sec3Title: "3. Cancellations & Quality Complaints",
    sec3Desc:
      "Under Malaysian Consumer Protection Regulations, fresh flowers and perishable botanicals are exempt from standard returns once prepared.",
    sec3Bullet1:
      "Cancellation Window: Order cancellations must be made at least 24 hours before the scheduled fulfillment date for a full refund or store credit.",
    sec3Bullet2:
      "Quality Disputes: If flowers arrive damaged or wilted, notify us via WhatsApp within 4 hours of delivery with clear photos for immediate replacement or resolution.",
    sec4Title: "4. Personal Data Protection Notice (PDPA 2010)",
    sec4Desc:
      "We respect your privacy and adhere to the Personal Data Protection Act 2010 (Malaysia).",
    sec4Bullet1:
      "Sender and recipient contact details, addresses, and greetings are collected strictly for order fulfillment and driver dispatch.",
    sec4Bullet2:
      "We do not sell, rent, or trade your personal data to external third parties.",
    sec4Bullet3:
      "Your data is stored securely and accessible only by authorized atelier personnel.",
    sec5Title: "5. Platform Provider Disclaimer (flowerapp.my)",
    sec5Desc:
      "flowerapp.my is an independent e-commerce software enablement platform. flowerapp.my is a technology provider and is not the merchant, seller, florist, or delivery carrier.",
    sec5Bullet1:
      "All floral products, pricing, orders, and delivery arrangements are solely the responsibility of {store}.",
    sec5Bullet2:
      "All payments (via Touch 'n Go eWallet, DuitNow QR, bank transfer, or payment gateway) are transacted directly between the customer and {store}. flowerapp.my does not hold or process customer funds.",
    sec5Bullet3:
      "Customer support, refund inquiries, and delivery updates must be directed to the florist via their official WhatsApp contact.",
    operatedBy: "Operated by {company}",
    ssmLabel: "SSM: {ssm}",
    iUnderstandAgree: "I Understand & Agree",

    // Success Page
    paymentAuthorized: "Payment Authorized",
    thankYouOrder: "Thank You for Your Order!",
    successDesc:
      "Your payment has been successfully recorded. Our florists at {store} are preparing your handcrafted arrangement.",
    orderReference: "Order Reference",
    notifyWhatsApp: "Notify Florist on WhatsApp",
    returnToCatalog: "Return to Catalog",
    loadingOrderStatus: "Loading order status...",
  },

  zh: {
    // Header & Announcement
    announcement: "提供当日鲜花配送与门店自取服务",
    chat: "客服咨询",
    chatAria: "在 WhatsApp 上咨询 {store}",

    // Hero Section
    artisanalCollection: "手工定制花艺系列",
    heroSubtitle: "为生命中最美好的时刻精心挑选的花礼",
    heroDesc:
      "在线挑选心仪花束，指定配送日期与时段，通过 Touch 'n Go 轻松完成付款确认。",
    doorstepDelivery: "专人送花上门",
    storePickup: "门店自取",
    selectedSlots: "指定配送时段",
    tngProof: "一触即通付款",

    // Search & Filter
    searchPlaceholder: "搜索花束、气球、玫瑰、开业花篮...",
    clearSearch: "清除搜索",
    allCategories: "全部",
    floralCatalog: "花礼目录",
    pricesIn: "价格单位：",
    sortByPrice: "按价格排序",
    priceHighLow: "价格：由高到低",
    priceLowHigh: "价格：由低到高",
    resetDefault: "恢复默认",
    removeSorting: "取消排序",
    searchBadge: "搜索",
    viewGrid: "宫格",
    viewList: "列表",
    inStockOnly: "仅看有货",
    hideSoldOut: "隐藏售罄",

    // Empty State
    noArrangements: "未找到相关花礼",
    noArrangementsDesc:
      "未能找到与 \"{query}\" 相关的花卉。请尝试其他关键词或浏览全部分类。",
    clearSearchFilters: "清除搜索与筛选",

    // Pagination
    showMore: "加载更多花礼",
    showingCount: "已显示 {count} / {total} 件商品",

    // Store Pickup Notice
    atelierPickup: "工作室门店自取",
    googleMaps: "谷歌地图导航 ↗",

    // Footer
    storePolicyTerms: "店铺条款与政策",
    privacyNotice: "隐私声明 (PDPA)",
    poweredBy: "技术支持：flowerapp.my • 软件平台服务商",
    footerDisclaimer:
      "所有花艺商品、款项交易、配送派发及售后咨询均由 {store} 直接负责与处理。",
    scrollTop: "回到顶部",

    // Product Card & Modal
    orderNow: "立即订购",
    viewPhoto: "查看大图",
    featured: "精选推荐",
    orderThisArrangement: "订购此款花礼",
    close: "关闭",
    closeFullPicture: "关闭大图",
    freshArrangement: "新鲜花艺制作",
    back: "返回",
    orderNowPrice: "立即订购 • {price}",

    // Checkout Drawer - Step 1
    fulfillmentAndDetails: "配送与订单信息",
    touchNGoPayment: "Touch 'n Go 扫码支付",
    drawerOrderFor: "订购店铺：{store} • 请选择配送或自取",
    drawerTngSubtitle: "扫描 TNG 二维码付款并通过 WhatsApp 确认订单。",
    selectedArrangement: "所选花礼款式",
    qty: "数量: {count}",
    storePickupAddress: "{store} 自取地址：",
    maps: "导航 ↗",
    fulfillmentDate: "配送 / 自取日期",
    today: "今天",
    todayClosed: "今天（已截止）",
    todayPaused: "今天（临时暂停）",
    tomorrow: "明天",
    tomorrowBlocked: "明天（暂不可选）",
    emergencyPauseNotice:
      "因单量饱和或突发情况，今日当日达已临时暂停接单，请选择明天或之后的日期配送。",
    tomorrowBlockedNotice:
      "明日配送时段暂不可选，请选择其他日期订购。",
    preferredTimeSlot: "期望送达时段",
    exactDeliveryTime: "指定具体时间",
    pastSlotsHidden: "已过时段已隐藏",
    sameDayClosed: "今日配送已截止",
    sameDayClosedExact:
      "今日当日送花需提前 {hours} 小时预约（截止时间为 {end}）。请选择明天或之后的日期。",
    sameDayClosedRange:
      "今日所有履约时段已全部截止，请选择明天或之后的日期订购。",
    switchToTomorrow: "切换至明天配送 →",
    quickSelect: "快捷选择：",
    minPreparationNotice:
      "* 需至少提前 {hours} 小时准备（今日最早可送达：{time}）。",
    rushOrderTitle: "当日加急配送时段",
    rushOrderNotice:
      "该时段临近制作截单时间，花艺师将竭力为您制作，具体送达时间将通过 WhatsApp 最终确认。",
    rushBadge: "⚡ 加急",
    // Holiday Peak Surcharge & Capacity
    holidayPeakBadge: "鲜花节日高峰期",
    holidayPeakNotice: "节日高峰期间进口花材受产地拍卖价变动影响，包含节日专属保鲜制作。",
    holidayCapacitySoldOut: "{holiday} 已满单！本店该日期手作名额已全满。",
    suggestAlternativeDate: "建议您预约 {altLabel}，尽早为您锁存新鲜鲜花！",
    switchToAltDate: "切换至 {altLabel} →",
    peakSurchargeLineItem: "节日鲜花高峰附加费 ({holiday})：",
    holidayBroadWindowsNotice: "为确保节日交通拥堵期间鲜花完好准时送达，{holiday} 期间统一采用大时段安心派送。",
    holidayInclusiveBadge: "节日专属定价",
    holidayDirectPriceNotice: "花礼标价已直接包含当季鲜花节日行情调整。",
    recipientContactDetails: "收件人与联络信息",
    recipientNamePlaceholder: "收件人 / 订购人姓名 *",
    phonePlaceholder: "WhatsApp 联络电话 *",
    addressPlaceholder:
      "详细送花地址（门牌/楼层、大厦、路名、邮编、城市）*",
    cardMessagePlaceholder:
      "免费心意贺卡留言（例如：'亲爱的，生日快乐！天天开心 ✨'）",
    proceedToPayment: "前往付款确认",
    orderConsentNotice: "提交订单即代表您已了解并同意我们的",
    substitutionStorePolicy: "花材替换与店铺政策",
    and: "以及",
    privacyNoticePdpa: "隐私声明 (PDPA)",
    closeDrawer: "关闭抽屉",

    // Checkout Drawer - Validation
    validationName: "请填写您的姓名。",
    validationPhone: "请填写 WhatsApp 联络电话。",
    validationDate: "请选择配送或自取日期。",
    validationPastDate: "配送或自取日期不能早于今天，请选择今天或未来的日期。",
    validationTodayPaused: "今日即日订单已暂停接单，请选择明天或之后的日期。",
    validationExactTime: "请指定期望送达时间。",
    validationExactTimeAdvance:
      "当日订单需至少提前 {hours} 小时预约（最早从 {time} 开始）。",
    validationExactTimeHours:
      "请选择营业时间内的送达时间（{start} – {end}）。",
    validationTimeSlot: "请选择期望配送时段。",
    validationAddress: "请填写完整的配送地址。",
    validationDeliveryZone: "请选择您的送花目的地配送区域。",
    validationStoreClosedDate: "所选日期本店休息不营业，请选择营业中的日期。",

    // Delivery Area & Add-ons
    deliveryArea: "配送区域 / 送花范围",
    selectDeliveryArea: "请选择配送区域 *",
    deliveryFee: "配送运费",
    freeDelivery: "免费专人送花",
    freeDeliveryThresholdNote: "消费满 {threshold} 享全单免运费！",
    freeDeliveryApplied: "免运费 (已享优惠)",
    enhanceYourGift: "心意加购配饰",
    enhanceYourGiftSubtitle: "为花礼增添一份更贴心的惊喜",
    selectedCount: "已选 {count} 项",
    subtotal: "花礼小计",
    addonsTotal: "配饰加购",
    orderTotal: "订单总额",
    storeClosedDayWarning:
      "本店在此日期休息不营业（{reason}），请选择其他配送日期。",
    regularWeeklyClosed: "每周常规公休日",
    holidayBlackoutClosed: "公休假期 / 特殊店休日",

    // Checkout Drawer - Step 2 (TngPaymentView)
    editOrderDetails: "返回修改订单信息",
    proofVerification: "收据凭证核对",
    instantGatewayVerification: "网关即时核实",
    totalPayableAmount: "应付总金额",
    copy: "复制",
    copied: "已复制！",
    arrangement: "花礼款式：",
    amountCopiedBanner:
      "已复制金额 {amount}！可直接在电子钱包中粘贴付款。",
    tngAutomatedGateway: "Touch 'n Go 官方支付网关",
    redirectGatewayDesc:
      "您将被引导至 {store} 的 Touch 'n Go 专属付款页面。",
    payViaTng: "通过 Touch 'n Go 支付 {amount}",
    openTngApp: "打开 Touch 'n Go 电子钱包",
    openTngAppSubtitle: "自动复制 {amount} 并启动 TNG App",
    openingTngHelper:
      "正在打开 Touch 'n Go... 若未自动跳转，请扫描下方二维码。",
    orScanQr: "或扫描付款二维码",
    accountLabel: "收款账户：",
    viewQrFullscreen: "查看二维码大图",
    howToCompleteOrder: "如何完成订购",
    step1Guide:
      "点击上方“打开 Touch 'n Go 电子钱包”（金额已自动复制）。",
    step2Guide:
      "转账付款 {amount} 并将收据截图保存。",
    step3Guide:
      "点击下方绿色按钮，通过 WhatsApp 发送订单与收据凭证！",
    confirmSendWhatsapp: "确认并通过 WhatsApp 发送",
    whatsappHelperText:
      "将自动打开 WhatsApp 并填好订单详情，请附上付款收据截图即可。",

    // Policy Modal
    policyModalTitle: "店铺条款与服务政策",
    sec1Title: "1. 花材与叶材替换政策",
    sec1Desc:
      "鲜花属于自然季节性商品，花材、花茎及包装资材均受每日花市供应影响。",
    sec1Bullet1:
      "如遇特定花材短缺，花艺师将使用同等或更高价值的花材进行品质替换。",
    sec1Bullet2:
      "我们将严格忠于原设计的主色系、视觉风格与艺术美感。",
    sec2Title: "2. 配送与履约条款",
    sec2Desc1:
      "配送时段：我们将尽全力在您指定的期望时段内送达。但若遇交通拥堵、恶劣天气或节假日高峰期，可能会有合理顺延。",
    sec2Desc2:
      "收件人未能接听：若司机到达后无法联系收件人且无人代收，配送员将拍照留证后放置于保安室/前台等安全地点，或带回工作室。后续二次配送需支付重新派送费。",
    sec2Desc3:
      "配送费用：标准运费根据工作室出发的实际车程距离计算，并通过 WhatsApp 最终核实确认。",
    sec3Title: "3. 订单取消与品质售后政策",
    sec3Desc:
      "根据马来西亚消费者保护法规，鲜花及易腐植物经制作后不适用无理由退换货。",
    sec3Bullet1:
      "取消期限：如需取消订单，须在原定配送日期的至少 24 小时前提出，方可全额退款或转为店铺消费额度。",
    sec3Bullet2:
      "品质问题反馈：如遇花卉枯萎或严重受损，请在送达后 4 小时内拍照并通过 WhatsApp 联系我们，我们将立即协助重制补发或协商妥善处理。",
    sec4Title: "4. 个人数据保护声明 (PDPA 2010)",
    sec4Desc:
      "我们尊重您的个人隐私，并严格遵守马来西亚《2010年个人数据保护法》(PDPA)。",
    sec4Bullet1:
      "订购人及收件人的联络电话、地址及贺卡留言仅用于订单制作及车手派送。",
    sec4Bullet2:
      "我们绝不会向任何外部第三方出售、出租或分享您的个人资料。",
    sec4Bullet3:
      "您的个人数据均在安全环境下存储，仅限获授权的花艺工作室人员查阅。",
    sec5Title: "5. 平台技术服务商声明 (flowerapp.my)",
    sec5Desc:
      "flowerapp.my 为独立花艺电商品牌提供技术支持软件平台，本身并非鲜花销售方、花店实体或配送公司。",
    sec5Bullet1:
      "所有花艺商品、价格、订单承接及配送安排均由 {store} 独立承担全责。",
    sec5Bullet2:
      "所有款项（通过 Touch 'n Go、DuitNow QR、银行转账或网关）均由客户直接支付至 {store} 账户。flowerapp.my 不扣留亦不代管任何客户款项。",
    sec5Bullet3:
      "客户服务、退款咨询及送花进度更新请直接通过官方 WhatsApp 与花店联络。",
    operatedBy: "由 {company} 运营",
    ssmLabel: "SSM 注册号：{ssm}",
    iUnderstandAgree: "我已了解并同意",

    // Success Page
    paymentAuthorized: "付款已提交",
    thankYouOrder: "感谢您的订购！",
    successDesc:
      "您的订单与付款已成功记录。{store} 的花艺师正在为您精心准备花礼。",
    orderReference: "订单编号",
    notifyWhatsApp: "在 WhatsApp 上联络花店确认",
    returnToCatalog: "返回花礼目录",
    loadingOrderStatus: "正在加载订单状态...",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

// Helpful category translations for standard florist terms
export const categoryTranslations: Record<string, string> = {
  All: "全部",
  Bouquets: "鲜花花束",
  Bouquet: "鲜花花束",
  Preserved: "永生花",
  "Preserved Flowers": "永生花礼",
  Balloons: "气球礼盒",
  Balloon: "气球礼盒",
  "Grand Opening": "开业花牌",
  "Opening Stand": "开业花牌",
  Vases: "花瓶花艺",
  Vase: "花瓶花艺",
  Plants: "绿植盆栽",
  Orchids: "胡姬花/兰花",
  Baskets: "花篮礼盒",
  Wedding: "婚庆花艺",
  Bridal: "新娘手绑花",
  Birthday: "生日花礼",
  Anniversary: "纪念日花礼",
};

export function translateCategory(cat: string, locale: Locale): string {
  if (locale === "zh") {
    return categoryTranslations[cat] || cat;
  }
  return cat;
}
