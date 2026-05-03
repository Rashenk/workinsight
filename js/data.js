// ======================== INITIALIZATION DATA ========================
function loadInitialData() {
    state.projects = [
        {"id":"12", "name":"Производство мебели", "stage":"В работе", "responsible":"Артем", "platform":"Instagram", "priority":"5", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"13", "name":"Трейдинг", "stage":"В работе", "responsible":"Артем", "platform":"Instagram", "priority":"5", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"1", "name":"Мужской бренд одежды", "stage":"Ждет выплаты, Готов", "responsible":"Дима Кичигин", "platform":"Instagram+ВК", "priority":"10", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"2", "name":"Картины по металлу", "stage":"Ждет выплаты, Готов", "responsible":"Дима Кичигин", "platform":"Instagram", "priority":"5", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"3", "name":"Аппаратный массаж", "stage":"Ждет выплаты, Выкладывается", "responsible":"Миша", "platform":"Instagram", "priority":"5", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"4", "name":"Покер еще новый, не знаю как маркировать", "stage":"В работе", "responsible":"Валера", "platform":"Instagram", "priority":"10", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"5", "name":"Личный бренд дети", "stage":"Ждет выплаты, Готов", "responsible":"Елена", "platform":"Instagram", "priority":"5", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"6", "name":"Ресницы", "stage":"Ждет выплаты, Готов", "responsible":"Елена", "platform":"Instagram", "priority":"5", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"7", "name":"Обучение детей плаванию", "stage":"В работе", "responsible":"Артем", "platform":"Instagram", "priority":"5", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"8", "name":"Рольставни", "stage":"В работе", "responsible":"Дима Кичигин", "platform":"Instagram", "priority":"5", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"9", "name":"Дизайн интерьера", "stage":"В работе", "responsible":"Елена", "platform":"Instagram", "priority":"5", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"10", "name":"Туры в Сахалин", "stage":"В работе", "responsible":"Артем", "platform":"Instagram", "priority":"5", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"11", "name":"Психолог новый", "stage":"В работе", "responsible":"Елена", "platform":"Instagram", "priority":"5", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"13", "name":"Репетитор Английский", "stage":"На паузе", "responsible":"Артем", "platform":"Instagram", "priority":"5", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"14", "name":"Личный бренд девочка танцы", "stage":"На паузе", "responsible":"Рубцов Александр", "platform":"Instagram+ТГ", "priority":"6", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"15", "name":"Идилия капельницы", "stage":"На паузе", "responsible":"Дима Кичигин", "platform":"Instagram", "priority":"7", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"16", "name":"Риелтор Грозный Альбина", "stage":"Готов, Выплачено", "responsible":"Саша Москва", "platform":"Instagram", "priority":"5", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"17", "name":"Диски", "stage":"Выплачено, Готов", "responsible":"Дима Кичигин", "platform":"Instagram", "priority":"5", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"18", "name":"Товары оптом из Китая", "stage":"Выплачено, Готов", "responsible":"Дима Кичигин", "platform":"Instagram", "priority":"5", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"19", "name":"Покер Москва", "stage":"Выплачено, Готов", "responsible":"Валера", "platform":"Instagram", "priority":"8", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"20", "name":"Авто в аренду Москва", "stage":"Выплачено, Готов", "responsible":"Артем", "platform":"Instagram", "priority":"8", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"21", "name":"Марафон по религии", "stage":"Готов, Выплачено", "responsible":"Дима Кичигин", "platform":"Instagram", "priority":"8", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"22", "name":"Консалтинг ресторанов", "stage":"Готов, Выплачено", "responsible":"Дима Кичигин", "platform":"Instagram", "priority":"8", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"23", "name":"Роллы, пицца, суши", "stage":"Готов, Выплачено", "responsible":"Дима Кичигин", "platform":"Instagram+ВК", "priority":"4", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"24", "name":"Квизы", "stage":"Готов, Выплачено", "responsible":"Дима Кичигин", "platform":"Instagram", "priority":"5", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"25", "name":"ИИ-тренер", "stage":"На паузе, Отказ", "responsible":"-------", "platform":"Instagram", "priority":"5", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"26", "name":"Покер Питер", "stage":"Выплачено, Готов", "responsible":"Рубцов Александр", "platform":"Instagram", "priority":"8", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"27", "name":"Клубника в шоколаде", "stage":"Выплачено, Отказ", "responsible":"Александр Костя", "platform":"Instagram", "priority":"10", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"28", "name":"Аквапарк Москва", "stage":"Отказ", "responsible":"-------", "platform":"Instagram", "priority":"6", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"29", "name":"Баер из Китая", "stage":"Выплачено, Отказ", "responsible":"Константин", "platform":"Instagram", "priority":"10", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"30", "name":"Психолог", "stage":"На паузе, Отказ", "responsible":"Елена", "platform":"Instagram", "priority":"5", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"31", "name":"Цветочный Минск", "stage":"Выплачено, Отказ", "responsible":"Паша Рубцов", "platform":"Instagram", "priority":"5", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"32", "name":"Студия рисования", "stage":"Отказ, Выплачено", "responsible":"Паша Рубцов", "platform":"Instagram", "priority":"4", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"33", "name":"Цветы", "stage":"Отказ, Выплачено", "responsible":"Саша Москва", "platform":"Instagram", "priority":"5", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"34", "name":"Пойзон", "stage":"Выплачено, Готов, Отказ", "responsible":"Саша Москва", "platform":"Instagram", "priority":"5", "planReels":0, "doneReels":0, "startDate":"", "comment":""},
        {"id":"35", "name":"Риелтор Калининград", "stage":"Отказ, Выплачено", "responsible":"Дима Кичигин", "platform":"Instagram", "priority":"5", "planReels":0, "doneReels":0, "startDate":"", "comment":""}
    ];

    state.analytics = [
        {"project":"Диски", "responsible":"Дима Кичигин", "startDate":"2026-03-11", "views":252295, "subs":54, "totalSubs":32, "interactions":0, "period":""},
        {"project":"Товары оптом из Китая", "responsible":"Дима Кичигин", "startDate":"2026-03-11", "views":402961, "subs":1710, "totalSubs":1688, "interactions":0, "period":""},
        {"project":"Покер Москва", "responsible":"Валера", "startDate":"2026-03-17", "views":133826, "subs":63, "totalSubs":49, "interactions":0, "period":""},
        {"project":"Риелтор Грозный Альбина", "responsible":"Александр", "startDate":"2026-03-10", "views":44473, "subs":0, "totalSubs":23, "interactions":0, "period":""},
        {"project":"Картины по металлу", "responsible":"Дима Кичигин", "startDate":"2026-03-23", "views":59626, "subs":0, "totalSubs":0, "interactions":0, "period":""},
        {"project":"Мужской бренд одежды", "responsible":"Дима Кичигин", "startDate":"2026-03-23", "views":15193, "subs":5, "totalSubs":2, "interactions":0, "period":""},
        {"project":"Идилия капельницы", "responsible":"Дима Кичигин", "startDate":"2026-03-31", "views":0, "subs":0, "totalSubs":0, "interactions":0, "period":""},
        {"project":"Покер Балашиха", "responsible":"Валера", "startDate":"2026-01-11", "views":27879, "subs":35, "totalSubs":31, "interactions":0, "period":""},
        {"project":"Аппаратный массаж", "responsible":"Миша", "startDate":"2026-03-10", "views":4015, "subs":0, "totalSubs":0, "interactions":0, "period":""},
        {"project":"Авто в аренду Москва", "responsible":"Артем", "startDate":"2026-03-01", "views":156849, "subs":24, "totalSubs":-10, "interactions":0, "period":""},
        {"project":"Обучение детей плаванью", "responsible":"Артем", "startDate":"2026-03-22", "views":81754, "subs":16, "totalSubs":13, "interactions":0, "period":""},
        {"project":"Личный бренд девочка танцы", "responsible":"Рубцов Александр", "startDate":"", "views":0, "subs":0, "totalSubs":0, "interactions":0, "period":""},
        {"project":"Личный бренд дети", "responsible":"Елена", "startDate":"2026-03-25", "views":1601, "subs":0, "totalSubs":0, "interactions":0, "period":""},
        {"project":"Ресницы", "responsible":"Елена", "startDate":"2026-03-20", "views":30156, "subs":20, "totalSubs":3, "interactions":0, "period":""},
        {"project":"Психолог", "responsible":"Елена", "startDate":"2026-04-10", "views":3752, "subs":0, "totalSubs":0, "interactions":0, "period":""},
        {"project":"Дизайн интерьера", "responsible":"Елена", "startDate":"2026-04-10", "views":7463, "subs":30, "totalSubs":29, "interactions":0, "period":""},
        {"project":"Рольставни", "responsible":"Дима Кичигин", "startDate":"2026-04-06", "views":0, "subs":0, "totalSubs":0, "interactions":0, "period":""},
        {"project":"Туры в Сахалин", "responsible":"Артем", "startDate":"2026-04-06", "views":0, "subs":0, "totalSubs":0, "interactions":0, "period":""},
        {"project":"Пойзон", "responsible":"Александр", "startDate":"", "views":0, "subs":0, "totalSubs":0, "interactions":0, "period":""},
        {"project":"Квизы", "responsible":"Дима Кичигин", "startDate":"2026-02-22", "views":0, "subs":0, "totalSubs":0, "interactions":0, "period":""},
        {"project":"Консалтинг ресторанов", "responsible":"Дима Кичигин", "startDate":"2026-02-17", "views":10395, "subs":0, "totalSubs":0, "interactions":0, "period":""},
        {"project":"Марафон по религии", "responsible":"Дима Кичигин", "startDate":"2026-02-17", "views":178823, "subs":181, "totalSubs":87, "interactions":0, "period":""},
        {"project":"Роллы, пицца, суши", "responsible":"Дима Кичигин", "startDate":"2026-02-10", "views":39371, "subs":5, "totalSubs":4, "interactions":0, "period":""},
        {"project":"Риелтор Калининград", "responsible":"Дима Кичигин", "startDate":"2026-03-10", "views":2855, "subs":19, "totalSubs":0, "interactions":0, "period":""},
        {"project":"Репетитор Английский", "responsible":"Артем", "startDate":"2026-04-06", "views":0, "subs":0, "totalSubs":0, "interactions":0, "period":""},
        {"project":"Цветы", "responsible":"------", "startDate":"", "views":0, "subs":0, "totalSubs":0, "interactions":0, "period":""},
        {"project":"Покер Питер", "responsible":"------", "startDate":"", "views":0, "subs":0, "totalSubs":0, "interactions":0, "period":""},
        {"project":"Баер из Китая", "responsible":"------", "startDate":"", "views":0, "subs":0, "totalSubs":0, "interactions":0, "period":""},
        {"project":"ИИ-тренер", "responsible":"------", "startDate":"", "views":0, "subs":0, "totalSubs":0, "interactions":0, "period":""},
        {"project":"Клубника в шоколаде", "responsible":"------", "startDate":"", "views":0, "subs":0, "totalSubs":0, "interactions":0, "period":""},
        {"project":"Студия рисования", "responsible":"------", "startDate":"", "views":0, "subs":0, "totalSubs":0, "interactions":0, "period":""},
        {"project":"Цветочный Минск", "responsible":"------", "startDate":"", "views":0, "subs":0, "totalSubs":0, "interactions":0, "period":""},
        {"project":"Аквапарк Москва", "responsible":"------", "startDate":"", "views":0, "subs":0, "totalSubs":0, "interactions":0, "period":""}
    ];

    state.tasks = [
        {"id":1, "project":"Все проекты", "task":"Создать чек-листы и прикрепить в таблицу + прописать комментарии", "startDate":"2026-02-04", "endDate":"2026-02-05", "responsible":"Александр Рубцов", "stage":"В процессе", "comment":""},
        {"id":2, "project":"Все проекты", "task":"Назначить ответственных и начать выкладку по всем активным проектам", "startDate":"2026-02-04", "endDate":"2026-02-15", "responsible":"Александр Рубцов", "stage":"В процессе", "comment":""},
        {"id":3, "project":"Клубника в шоколаде", "task":"Найти оператора в Иркутске за 10 тыс. на 4-5 часов с камерой и светом", "startDate":"2026-02-04", "endDate":"2026-02-15", "responsible":"Александр Рубцов", "stage":"В процессе", "comment":""},
        {"id":4, "project":"Марафон по религии", "task":"Выплатить Насте за религию", "startDate":"2026-02-04", "endDate":"2026-02-15", "responsible":"Александр Рубцов", "stage":"В процессе", "comment":""},
        {"id":5, "project":"БАДы", "task":"Выплатить Диме за БАДы", "startDate":"2026-02-04", "endDate":"2026-02-15", "responsible":"Александр Рубцов", "stage":"В процессе", "comment":""},
        {"id":6, "project":"Консалтинг ресторанов", "task":"Поменять проект и поставить замену в ближайшее время", "startDate":"2026-02-12", "endDate":"2026-02-13", "responsible":"", "stage":"В процессе", "comment":""}
    ];

    state.employees = [
        {"firstName":"Александр", "lastName":"Рубцов", "city":"Новоуральск", "employment":"Учеба + работа", "projects":"Девочка танцы", "status":"Активен"},
        {"firstName":"Елена", "lastName":"", "city":"Новоуральск", "employment":"Работа", "projects":"Ресницы, Личный бренд дети", "status":"Активен"},
        {"firstName":"Дима", "lastName":"Кичигин", "city":"Новоуральск", "employment":"Свободен", "projects":"Марафон, Консалтинг, Диски, Квизы", "status":"Активен"},
        {"firstName":"Александр", "lastName":"", "city":"Москва", "employment":"Учеба + работа", "projects":"Риелтор Грозный, Цветы", "status":"НЕАктивен"},
        {"firstName":"Артем", "lastName":"", "city":"Екатеринбург", "employment":"Учеба + работа", "projects":"Авто в аренду Москва", "status":"Активен"},
        {"firstName":"Валера", "lastName":"", "city":"Новоуральск", "employment":"Свободен", "projects":"Покер Москва", "status":"Активен"},
        {"firstName":"Виктор", "lastName":"Федосеев", "city":"Новоуральск", "employment":"Работа", "projects":"Обучение плаванию", "status":"НЕАктивен"},
        {"firstName":"Паша", "lastName":"Рубцов", "city":"Новоуральск", "employment":"Учеба", "projects":"Цветочный Минск, Студия рисования", "status":"НЕАктивен"},
        {"firstName":"Константин", "lastName":"", "city":"Новоуральск", "employment":"Учеба + работа", "projects":"", "status":"НЕАктивен"},
        {"firstName":"Виктория", "lastName":"", "city":"Новоуральск", "employment":"Работа", "projects":"", "status":"НЕАктивен"},
        {"firstName":"Миша", "lastName":"", "city":"Екатеринбург", "employment":"Учеба + работа", "projects":"", "status":"Стажер"}
    ];

    state.access = [
        {"project":"Покер Москва", "tgLink":"https://t.me/+95sY8wwOUvkwYWUy", "login":"poker.nuts.moscow", "password":"NutS1232123", "note":"2508507"},
        {"project":"Авто в аренду Москва", "tgLink":"https://t.me/+L_NlJai8Um1mM2Yy", "login":"rescom_prokatmsk", "password":"rescomspb2021", "note":""},
        {"project":"Личный бренд девочка танцы", "tgLink":"https://t.me/+JtqMzj_lKmYwNGM6", "login":"alex.queendance", "password":"Sasa2408", "note":""},
        {"project":"Консалтинг ресторанов", "tgLink":"https://t.me/+LgoX66sDcMAzZWEy", "login":"dmitriy.rest", "password":"chef_dima97", "note":""}
    ];

    saveDataToLocalStorage();
}
