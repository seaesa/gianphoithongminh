# -*- coding: utf-8 -*-
"""Push data/contact.json through every place the site states a contact detail.

The clone borrows its UI from thegioigianphoi.vn but its business details from
gianphoichinhhang.com, so the old shop's four phone numbers, two mailboxes, four
branch addresses and two Facebook pages all have to go — including the ones
baked into extracted page content. Everything here is idempotent: the script
rewrites data/site.json and data/pages/*.json in place and can be re-run.

    python3 scripts/apply-contact.py
"""
import glob, json, re

C = json.load(open('data/contact.json', encoding='utf-8'))

# ── the numbers, mailboxes and pages being retired ──────────────────────────

OLD_PHONES = ['0888 900 986', '0888.900.986', '0888900986',
              '0979 680 195', '0979680195',
              '0926 46 36 36', '0978 241 689', '097 824 1689',
              '0935.198.190', '0935 198 190', '0976905060']
_ONE = '|'.join(re.escape(p) for p in sorted(OLD_PHONES, key=len, reverse=True))
# A number, or a run of them joined by a dash or "và" — the old site printed
# "0888 900 986 – 0979 680 195" and the like, which collapses to one hotline.
PHONE_RE = re.compile(r'(' + _ONE + r')(?:\s*(?:[-–—]|và)\s*(?:' + _ONE + r'))*')

EMAIL_RE = re.compile(r'(?:thegioigianphoi\.vn|hoaphatstar(?:\.net)?)@gmail\.com')
# …and the two places where the mailbox is split across inline tags, e.g.
#   <em><strong>thegioigianphoi.vn</strong><strong>@gmail.com</strong></em>
#   <strong>thegioigianphoi.vn</strong><em><span …><b>@gmail.com</b></span></em>
INLINE = r'(?:em|b|strong|span)'
SPLIT_EMAIL_RE = re.compile(
    r'<strong>thegioigianphoi\.vn</strong>'
    r'((?:<' + INLINE + r'[^>]*>)*)'
    r'@gmail\.com'
    r'((?:</' + INLINE + r'>)*)')
CLOSER_RE = re.compile(r'</' + INLINE + r'>')


FACEBOOK_RE = re.compile(r'https?://(?:www\.|web\.)?facebook\.com/'
                         r'(?:gianphoithongminhanhduong/?|hoaphatstar\.net/?)')
ZALO_RE = re.compile(r'https?://zalo\.me/\d+')

# the old shop's own domain, quoted both as a website and (once) as a mailbox
SITE_RE = re.compile(r'https?://(?:www\.)?hoaphatstar\.net/?')
SITE_AS_EMAIL_RE = re.compile(r'<strong><em>hoaphatstar\.net</em></strong>')

COMPANY_RE = re.compile(r'CÔNG TY TNHH XÂY LẮP VÀ THƯƠNG MẠI\s*(?:<[^>]+>\s*)*ÁNH DƯƠNG')
COMPANY_MIXED_RE = re.compile(r'Công ty TNHH Xây lắp và Thương mại\s*(?:<[^>]+>\s*)*ÁNH DƯƠNG')

# A run of sibling <p>/<li> elements, one per old branch address.
BRANCH_LINE = r'<(p|li)([^>]*)>\s*\+?\s*CƠ SỞ [^<]*</\1>'
BRANCH_RUN_RE = re.compile(r'(?:' + BRANCH_LINE + r'\s*){2,}')
BRANCH_ONE_RE = re.compile(BRANCH_LINE)
# the footer widget lists its branches as plain "+ CƠ SỞ …" lines in one <div>
BRANCH_TEXT_RE = re.compile(r'(?:\s*\+\s*CƠ SỞ [^\n<]*){2,}')
STORE_TITLE_RE = re.compile(r'HỆ THỐNG CỬA HÀNG GIÀN PHƠI HÒA PHÁT')


def split_email(m):
    """Replace the split mailbox without swallowing a closer we never opened.

    The second form closes an <em> that was opened *before* the match, so any
    closing tag beyond the number of openers inside the match has to be put
    back — dropping it leaves the element unbalanced, and the browser's error
    recovery then reshapes the whole article.
    """
    openers = len(re.findall(r'<' + INLINE + r'[^>]*>', m.group(1)))
    closers = CLOSER_RE.findall(m.group(2))
    return f'<strong>{C["email"]}</strong>' + ''.join(closers[openers:])


def phones(text):
    """Swap every retired number — or run of them — for the new hotline.

    A dotted original (`0888.900.986`) keeps the dotted form of the new number,
    so the surrounding copy still reads the way it was written.
    """
    return PHONE_RE.sub(
        lambda m: C['phoneDots'] if '.' in m.group(1) else C['phone'], text)


def branch_lines():
    """The replacement facts, in the order they read best.

    The old shop listed four branches as four sibling elements. Emitting the
    same number of lines keeps every product page exactly as tall as the one it
    was cloned from, which is what scripts/verify-pages.mjs measures — so the
    new details are spread over four lines rather than collapsed into one.
    """
    return [f'Địa chỉ: {C["address"]}',
            f'Khu vực phục vụ: {C["area"]} — khảo sát và lắp đặt tận nơi',
            f'Giờ làm việc: {C["hours"]}',
            f'Zalo / hotline: {C["phone"]}']


def branches(text):
    """Swap the run of old branch addresses for the same number of new lines."""
    def sub(m):
        parts = list(BRANCH_ONE_RE.finditer(m.group(0)))
        lines = branch_lines()[:len(parts)]
        return '\n'.join(
            f'<{p.group(1)}{p.group(2)}>{line}</{p.group(1)}>'
            for p, line in zip(parts, lines))
    text = BRANCH_RUN_RE.sub(sub, text)
    return BRANCH_TEXT_RE.sub(
        lambda m: '\n' + '\n'.join(branch_lines()[:len(re.findall(r'CƠ SỞ', m.group(0)))]),
        text)


def rewrite(text):
    if not text:
        return text
    text = SPLIT_EMAIL_RE.sub(split_email, text)
    text = SITE_AS_EMAIL_RE.sub(f'<strong><em>{C["email"]}</em></strong>', text)
    text = SITE_RE.sub(C['website'], text)
    text = EMAIL_RE.sub(C['email'], text)
    text = branches(text)
    text = phones(text)
    text = FACEBOOK_RE.sub(C['facebook'], text)
    text = ZALO_RE.sub(C['zalo'], text)
    text = COMPANY_RE.sub(C['company'], text)
    text = COMPANY_MIXED_RE.sub(C['companyMixed'], text)
    text = STORE_TITLE_RE.sub(C['storeTitle'], text)
    text = text.replace('ÁNH DƯƠNG', C['shortName'])
    return text


# ── the Liên hệ page gets a real contact block, not a patched one ───────────
#
# The live page is a bare address list with no form at all. The clone leads with
# a request form — the thing a visitor actually came to do — and keeps the
# address list beside it. There is no backend here, so the form validates,
# stores the request in localStorage and confirms with a request code, exactly
# like the checkout and the quick-order modal do (assets/js/shop.js).

CONTACT_FORM = f'''
<div class="gp-contact">
<div class="gp-contact__main">
<h2 class="gp-contact__title">Gửi yêu cầu tư vấn</h2>
<p class="gp-contact__lead">Để lại thông tin, {C['shortName']} sẽ gọi lại để tư vấn và báo giá miễn phí — khảo sát tận nơi tại {C['area']}.</p>
<form class="gp-contact-form" id="gpContactForm" novalidate="">
<div class="gp-field-row">
<div class="gp-field">
<label for="gpContactName">Họ và tên <span class="req">*</span></label>
<input type="text" id="gpContactName" name="name" autocomplete="name" placeholder="Nguyễn Văn A" required="">
<span class="gp-error">Vui lòng nhập họ và tên.</span>
</div>
<div class="gp-field">
<label for="gpContactPhone">Số điện thoại <span class="req">*</span></label>
<input type="tel" id="gpContactPhone" name="phone" autocomplete="tel" placeholder="09xx xxx xxx" required="">
<span class="gp-error">Số điện thoại phải có 10 chữ số.</span>
</div>
</div>
<div class="gp-field-row">
<div class="gp-field">
<label for="gpContactEmail">Email</label>
<input type="email" id="gpContactEmail" name="email" autocomplete="email" placeholder="email@example.com">
<span class="gp-error">Email chưa đúng định dạng.</span>
</div>
<div class="gp-field">
<label for="gpContactTopic">Bạn cần hỗ trợ về</label>
<select id="gpContactTopic" name="topic">
<option>Tư vấn và báo giá</option>
<option>Đặt lịch khảo sát, lắp đặt</option>
<option>Bảo hành, sửa chữa</option>
<option>Hợp tác, làm đại lý</option>
<option>Khiếu nại dịch vụ</option>
</select>
</div>
</div>
<div class="gp-field">
<label for="gpContactAddress">Địa chỉ lắp đặt</label>
<input type="text" id="gpContactAddress" name="address" autocomplete="street-address" placeholder="Số nhà, tên đường, phường/xã…">
</div>
<div class="gp-field">
<label for="gpContactMessage">Nội dung <span class="req">*</span></label>
<textarea id="gpContactMessage" name="message" placeholder="Mô tả ban công / lô gia, loại giàn phơi bạn quan tâm, thời gian muốn được gọi lại…" required=""></textarea>
<span class="gp-error">Vui lòng nhập nội dung cần tư vấn (ít nhất 10 ký tự).</span>
</div>
<button type="submit" class="gp-btn gp-btn--primary gp-btn--block" id="gpContactSubmit">GỬI YÊU CẦU</button>
<p class="gp-contact__hint">Cần gấp? Gọi <a href="tel:{C['phoneTel']}">{C['phone']}</a> hoặc <a href="{C['zalo']}" target="_blank" rel="noopener">chat Zalo</a> — trực máy {C['hours']}.</p>
</form>
<div class="gp-success" id="gpContactSuccess" hidden="">
<i class="fa fa-check-circle" aria-hidden="true"></i>
<h3>Đã nhận yêu cầu của bạn!</h3>
<p>Mã yêu cầu: <span class="gp-order-code" id="gpContactCode"></span></p>
<p>{C['shortName']} sẽ liên hệ lại trong giờ làm việc ({C['hours']}). Cần gấp, vui lòng gọi <a href="tel:{C['phoneTel']}">{C['phone']}</a>.</p>
<div class="gp-success-actions">
<button type="button" class="gp-btn gp-btn--ghost" id="gpContactAgain">Gửi yêu cầu khác</button>
</div>
</div>
</div>
<aside class="gp-contact__aside">
<h2 class="gp-contact__title">Thông tin liên hệ</h2>
<div id="address-box">
<div id="address-list">
<div class="info-item address">
<i class="fa fa-home"></i>
<div class="tit-contain">{C['storeTitle']}<br/>{C['address']}</div>
</div>
<div class="info-item phone">
<i class="fa fa-phone"></i>
<div class="tit-contain">HOTLINE TƯ VẤN MIỄN PHÍ<br/><a href="tel:{C['phoneTel']}">{C['phone']}</a></div>
</div>
<div class="info-item email">
<i class="fa fa-envelope"></i>
<div class="tit-contain"><a href="mailto:{C['email']}">{C['email']}</a></div>
</div>
<div class="info-item">
<i class="fa fa-clock-o"></i>
<div class="tit-contain">Giờ làm việc: {C['hours']}</div>
</div>
<div class="info-item">
<i class="fa fa-map-marker"></i>
<div class="tit-contain">Khu vực phục vụ: {C['area']} — khảo sát và lắp đặt tận nơi</div>
</div>
<div class="info-item">
<i class="fa fa-facebook"></i>
<div class="tit-contain"><a href="{C['facebook']}" target="_blank" rel="noopener">{C['facebookName']}</a></div>
</div>
<div class="info-item">
<i class="fa fa-comments"></i>
<div class="tit-contain"><a href="{C['zalo']}" target="_blank" rel="noopener">Chat Zalo: {C['phone']}</a></div>
</div>
</div>
</div>
</aside>
</div>'''

CONTACT_PAGE = f'''
<article class="post-8 page type-page status-publish hentry" id="post-8">
<header class="entry-header">
<h1 class="entry-title">Liên hệ</h1> </header><!-- .entry-header -->
<div class="entry-content">
<div class="col-xs-12" style="margin-bottom: 20px;">
<p>Để liên hệ với <strong>{C['company']}</strong>, bạn có thể gửi yêu cầu tư vấn ngay bên dưới, gọi trực tiếp theo hotline, nhắn Zalo, gửi email hoặc ghé showroom của chúng tôi.</p>
{CONTACT_FORM}
<p><iframe src="{C['map']}" width="100%" height="320" style="border:0;" allowfullscreen="" loading="lazy" title="Bản đồ đường tới showroom"></iframe></p>
</div>
</div><!-- .entry-content -->
<footer class="entry-footer">
</footer><!-- #post-## -->
</article><!-- #post-## -->'''


# ── data/site.json ──────────────────────────────────────────────────────────

def apply_site():
    s = json.load(open('data/site.json', encoding='utf-8'))

    s['topbar']['social'] = [{'icon': 'fa-facebook', 'href': C['facebook']}]
    s['topbar']['items'] = [
        {'icon': 'fa-phone', 'text': 'Hotline:', 'strong': C['phone'],
         'href': 'tel:' + C['phoneTel']},
        {'icon': 'fa-envelope-o', 'text': C['email'], 'strong': C['email'],
         'href': 'mailto:' + C['email']},
    ]

    sv = s['sidebar']['service']
    sv['phone'] = C['phoneDots']
    for link in sv['links']:
        if link['icon'] == 'fa-facebook-square':
            link['href'] = C['facebook']
        elif link['icon'] == 'fa-envelope-o':
            link['href'] = 'mailto:' + C['email']

    F = s['footer']
    F['contact_title'] = C['brand']
    F['contact'] = [
        {'icon': 'fa-home', 'cls': 'address',
         'lines': [C['storeTitle'], C['address'], 'Khu vực phục vụ: ' + C['area']]},
        {'icon': 'fa-phone', 'cls': 'phone',
         'lines': ['HOTLINE TƯ VẤN MIỄN PHÍ', C['phone'], 'Giờ làm việc: ' + C['hours']]},
        {'icon': 'fa-envelope', 'cls': 'email', 'lines': [C['email']]},
    ]
    for soc in F['socials']:
        if 'facebook' in soc['cls']:
            soc['href'] = C['facebook']

    # raw captures kept alongside the structured data — keep them consistent
    for holder, key in [(s['footer'], 'contact_html'), (s['footer'], 'dmca_html'),
                        (s['footer'], 'links_html'), (s['footer'], 'support_html'),
                        (s, 'sidebar_raw'), (s, 'static_block_html'),
                        (s, 'home_news_html'), (s['floating'], 'ring_html'),
                        (s['floating'], 'tail_html')] \
            + [(w, 'html') for w in s['footer']['menus']] \
            + [(w, 'html') for w in s['sidebar_raw'] if isinstance(w, dict)]:
        if isinstance(holder.get(key), str):
            holder[key] = rewrite(holder[key])
    for link in F['links']:
        link['href'] = FACEBOOK_RE.sub(C['facebook'], link['href'])

    json.dump(s, open('data/site.json', 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)


SITE_NAME = 'Giàn phơi quần áo thông minh Hòa Phát'
# one page's <title> still carried a long-dead domain of the original shop
STRAY_TITLE_RE = re.compile(r'gianphoihoaphatt\.net')


def apply_pages():
    touched = 0
    for f in sorted(glob.glob('data/pages/*.json')):
        rec = json.load(open(f, encoding='utf-8'))
        before = (rec['main'], rec['title'], json.dumps(rec['menuState'], sort_keys=True))
        if f.endswith('/lien-he.json'):
            rec['main'] = CONTACT_PAGE
            # index 1 of `extranav` is LIÊN HỆ (see render.py's header())
            rec['menuState']['extranav'] = ['', 'current-menu-item']
        else:
            rec['main'] = rewrite(before[0])
        rec['title'] = STRAY_TITLE_RE.sub(SITE_NAME, rec['title'])
        if (rec['main'], rec['title'], json.dumps(rec['menuState'], sort_keys=True)) != before:
            json.dump(rec, open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
            touched += 1

    # keep the index's copy of each title in step with the record it describes
    index = json.load(open('data/pages-index.json', encoding='utf-8'))
    for row in index:
        row['title'] = STRAY_TITLE_RE.sub(SITE_NAME, row['title'])
        # its body is rebuilt from data/contact.json, so it no longer matches live
        if row['path'] == 'lien-he/index.html':
            row['cloneOnly'] = True
    json.dump(index, open('data/pages-index.json', 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    return touched


def apply_custom():
    c = json.load(open('data/custom.json', encoding='utf-8'))
    c['bank']['holder'] = C['company']
    c['shipping']['freeNote'] = f'Miễn phí khảo sát và lắp đặt tại {C["area"]}.'
    json.dump(c, open('data/custom.json', 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)


def main():
    apply_site()
    n = apply_pages()
    apply_custom()
    print(f'contact details applied — site.json, custom.json, {n} page records')


if __name__ == '__main__':
    main()
