from lux.extensions.ui import *


def add_css(all):
    css = all.css
    media = all.media
    vars = all.variables
    vars.sidebar.width = px(200)

    if all.theme == 'dark':
        url = 'https://bootswatch.com/darkly/bootstrap.css'
        highlight = 'railscasts'
        theme_dark(all)
    else:
        url = 'https://bootswatch.com/spacelab/bootstrap.css'
        highlight = 'tomorrow'
        theme_light(all)

    all.app.config['CODE_HIGHLIGHT_THEME'] = highlight
    css('body',
        CssInclude(url))

    vars.font_family = '"freight-text-pro",Georgia,Cambria,"Times New Roman",Times,serif'
    vars.font_size = px(18)
    vars.line_height = 1.5
    vars.index.background = '#333'
    vars.scroll.background = '#99EBFF'

    css('.page-header, .full-header',
        padding_top=vars.navbar.height)

    css('.navbar-brand img',
        height=vars.navbar.height)

    css('.page-header.index-header',
        background=vars.index.background,
        color='#fff',
        margin=0,
        width=pc(101),
        height=pc(101),
        min_height=pc(100))

    css('html, body, .fullpage',
        height=pc(101),
        min_height=pc(101))

    css('form',
        font_size=px(14))

    css('#page-main',
        min_height=px(400),
        padding_bottom=px(50))

    css('#footer',
        background=vars.index.background,
        color=vars.colors.gray_light,
        min_height=px(300),
        padding=spacing(30, 0, 40))

    css('#lux-logo',
        width=px(400))

    media(max_width=px(600)).css('#lux-logo',
        width=px(300))

    css('.trianglify-background',
        padding_top=px(30))

    css('.trianglify-box',
        Radius(px(5)),
        Shadow(px(1), px(1), px(4), color=color(0, 0, 0, 0.4)),
        padding=px(20),
        max_width=px(400),
        background=color(255, 255, 255, 0.6))

    features(all)
    error_page(all)


def error_page(all):
    css = all.css
    media = all.media
    cfg = all.app.config
    mediaurl = cfg['MEDIA_URL']
    collapse_width = px(cfg['NAVBAR_COLLAPSE_WIDTH'])

    css('#page-error',
        css(' a, a:hover',
            color=color('#fff'),
            text_decoration='underline'),
        Background(url=mediaurl+'giottoweb/see.jpg',
                   size='cover',
                   repeat='no-repeat',
                   position='left top'),
        color=color('#fff'))
    css('.error-message-container',
        BoxSizing('border-box'),
        padding=spacing(40, 120),
        background=color(0, 0, 0, 0.4),
        height=pc(100)),
    css('.error-message',
        css(' p',
            font_size=px(50)))
    media(max_width=collapse_width).css(
        '.error-message p',
        font_size=px(32)).css(
        '.error-message-container',
        text_align='center',
        padding=spacing(40, 0))


def features(all):
    css = all.css
    media = all.media

    css('.features article',
        Clearfix(),
        float='left',
        padding=px(30),
        width=pc(33.33))

    media(max_width=px(978)).css('.features article',
        width=pc(50))

    media(max_width=px(600)).css('.features article',
        width='auto',
        float='none')


def theme_light(all):
    vars = all.variables
    vars.color = color('#333')
    vars.background = color('#fff')


def theme_dark(all):
    vars = all.variables
    vars.color = color('#fff')
    vars.background = color('#222')
