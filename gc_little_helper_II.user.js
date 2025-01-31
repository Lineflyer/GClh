// ==UserScript==
// @name             GC little helper II
// @namespace        http://www.amshove.net
//--> $$000
// @version          0.10
//<-- $$000
// @include          http*://www.geocaching.com/*
// @include          http*://maps.google.tld/*
// @include          http*://www.google.tld/maps*
// @include          http*://project-gc.com/Tools/PQSplit*
// @include          http*://www.openstreetmap.org*
// @exclude          /^https?://www\.geocaching\.com/(login|jobs|careers|brandedpromotions|promotions|blog|help|seek/sendtogps|profile/profilecontent)/
// @resource jscolor https://raw.githubusercontent.com/2Abendsegler/GClh/master/data/jscolor.js
// @require          http://ajax.googleapis.com/ajax/libs/jquery/1.6.4/jquery.min.js
// @require          http://ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/jquery-ui.min.js
// @require          https://cdnjs.cloudflare.com/ajax/libs/dropbox.js/2.5.2/Dropbox-sdk.min.js
// @require          https://raw.githubusercontent.com/2Abendsegler/GClh/master/data/gclh_defi.js
// @require          https://www.geocaching.com/scripts/MarkdownDeepLib.min.js
// @require          https://www.geocaching.com/scripts/SmileyConverter.js
// @resource leafletjs   https://raw.githubusercontent.com/2Abendsegler/GClh/master/data/leaflet.js
// @resource leafletcss  https://raw.githubusercontent.com/2Abendsegler/GClh/master/data/leaflet.css
// @connect          maps.googleapis.com
// @connect          raw.githubusercontent.com
// @connect          api.open-elevation.com
// @connect          api.geonames.org
// @description      Some little things to make life easy (on www.geocaching.com).
// @copyright        2010-2016 Torsten Amshove, 2016-2019 2Abendsegler, 2017-2019 Ruko2010
// @author           Torsten Amshove; 2Abendsegler; Ruko2010
// @icon             https://raw.githubusercontent.com/2Abendsegler/GClh/master/images/gclh_logo.png
// @license          GNU General Public License v2.0
// @grant            GM_getValue
// @grant            GM_setValue
// @grant            GM_log
// @grant            GM_xmlhttpRequest
// @grant            GM_getResourceText
// @grant            GM_info
// @grant            GM_addStyle
// ==/UserScript==

var start = function(c) {
    checkRunningOnce();
    quitOnAdFrames()
        .then(function() {return jqueryInit(c);})
        .then(function() {return browserInit(c);})
        .then(function() {return constInit(c);})
        .then(function() {return variablesInit(c);})
        .done(function() {
            if (document.location.href.match(/^https?:\/\/maps\.google\./) || document.location.href.match(/^https?:\/\/www\.google\.[a-zA-Z.]*\/maps/)) {
                mainGMaps();
            } else if (document.location.href.match(/^https?:\/\/www\.openstreetmap\.org/)) {
                mainOSM();
            } else if (document.location.href.match(/^https?:\/\/www\.geocaching\.com/)) {
                if (is_page('lists') || is_page('searchmap')) {
                    asynchronGC();
                } else {
                    mainGC();
                }
            }else if (document.location.href.match(/^https?:\/\/project-gc\.com\/Tools\/PQSplit/)) {
                mainPGC();
            }
        });
};

var checkRunningOnce = function(c) {
    if (document.getElementsByTagName('head')[0]) {
        if (document.getElementById('GClh_II_running')){
            var text = 'The script "GC little helper II" is already running.\nPlease make sure that it runs only once.\n\nDo you want to see tips on how this could happen \nand what you can do about it?';
            var url  = 'https://github.com/2Abendsegler/GClh/blob/master/docu/faq.md';
            if (window.confirm(text)) window.open(url, '_blank');
        } else appendMetaId("GClh_II_running");
    }
};

var quitOnAdFrames = function(c) {
    var quitOnAdFramesDeref = new jQuery.Deferred();
    if(window.name) {
        if (window.name.substring(0, 18) !== 'google_ads_iframe_') quitOnAdFramesDeref.resolve();
        else quitOnAdFramesDeref.reject();
    }
    else {
        quitOnAdFramesDeref.resolve();
    }
    return quitOnAdFramesDeref.promise();
};

var jqueryInit = function(c) {
    if (typeof c.$ === "undefined") c.$ = c.$ || unsafeWindow.$ || window.$ || null;
    if (typeof c.jQuery === "undefined") c.jQuery = c.jQuery || unsafeWindow.jQuery || window.jQuery || null;
    var jqueryInitDeref = new jQuery.Deferred();
    jqueryInitDeref.resolve();
    return jqueryInitDeref.promise();
};

var leafletInit = function(c) {
    try {
        if ( typeof L == "undefined" ) {
            if ( !$('#gclh_leafletjs').length ) {
                var newCSS = GM_getResourceText ("leafletcss");
                GM_addStyle (newCSS);
                var newJS = GM_getResourceText("leafletjs");
                injectPageScript(newJS, "body", 'gclh_leafletjs');
            }
        }

        if ( L.version != "0.7.2" ) {
            gclh_error("Unexpected vesion of leaflet. Version 0.7.2 required, version "+L.version+" is loaded.");
        }
    } catch(e) { gclh_error("leafletInit failed",e);}
};

var browserInit = function(c) {
    var browserInitDeref = new jQuery.Deferred();
    c.CONFIG = {};
    // Browser ermitteln. Opera ... ist auch chrome.
    c.browser = (typeof(chrome) !== "undefined") ? "chrome" : "firefox";
    c.GM_setValue("browser", browser);
    c.CONFIG = JSON.parse(GM_getValue("CONFIG", '{}'));
    // Ist Tampermonkey der Scriptmanager.
    c.isTM = (typeof GM_info != "undefined" && typeof GM_info.scriptHandler != "undefined" && GM_info.scriptHandler == "Tampermonkey") ? true : false;
    c.GM_setValue("isTampermonkey", isTM);
    browserInitDeref.resolve();
    return browserInitDeref.promise();
};

var constInit = function(c) {
    var constInitDeref = new jQuery.Deferred();

    c.scriptName = GM_info.script.name;
    c.scriptVersion = GM_info.script.version;
    c.scriptNameConfig = c.scriptName.replace("helper", "helper Config");
    c.scriptNameSync = c.scriptName.replace("helper", "helper Sync");
    c.scriptShortNameConfig = "GClh Config II";
    c.scriptShortNameSync = "GClh Sync II";
    c.anzCustom = 10;
    c.anzTemplates = 10;
    c.bookmarks_def = new Array(31, 69, 14, 16, 32, 33, 48, "0", 8, 18, 54, 51, 55, 47, 10, 2, 35, 9, 17, 67, 23, 22, 66, 68);
    c.defaultConfigLink = "/my/default.aspx#GClhShowConfig";
    c.defaultSyncLink = "/my/default.aspx#GClhShowSync";
    c.defaultFindPlayerLink = "/my/default.aspx#GClhShowFindPlayer";
    c.urlScript = "https://raw.githubusercontent.com/2Abendsegler/GClh/master/gc_little_helper_II.user.js";
    c.urlConfigSt = "https://raw.githubusercontent.com/2Abendsegler/GClh/master/data/config_standard.txt";
    c.urlChangelog = "https://github.com/2Abendsegler/GClh/blob/master/docu/changelog.md#readme";
    c.urlFaq = "https://github.com/2Abendsegler/GClh/blob/master/docu/faq.md#readme";
    c.urlDocu = "https://github.com/2Abendsegler/GClh/blob/master/docu/";
    c.urlImages = "https://raw.githubusercontent.com/2Abendsegler/GClh/master/images/";
    c.urlImagesSvg = "https://rawgit.com/2Abendsegler/GClh/master/images/";
    c.idCopyName = "idName";
    c.idCopyCode = "idCode";
    c.idCopyUrl = "idUrl";
    c.idCopyCoords = "idCoords";
    c.idCopyOrg = "idOrg";
    // Define bookmarks:
    c.bookmarks = new Array();
    // WICHTIG: Die Reihenfolge darf hier auf keinen Fall geändert werden, weil dadurch eine falsche Zuordnung zu den gespeicherten Userdaten erfolgen würde!
    bookmark("Watchlist", "/my/watchlist.aspx", c.bookmarks);
    bookmark("Logs Geocaches", "/my/geocaches.aspx", c.bookmarks);
    bookmark("Own Geocaches", "/my/owned.aspx", c.bookmarks);
    bookmark("Logs Trackables", "/my/travelbugs.aspx", c.bookmarks);
    bookmark("Trackables Inventory", "/my/inventory.aspx", c.bookmarks);
    bookmark("Trackables Collection", "/my/collection.aspx", c.bookmarks);
    bookmark("Logs Benchmarks", "/my/benchmarks.aspx", c.bookmarks);
    bookmark("Member Features", "/my/subscription.aspx", c.bookmarks);
    bookmark("Friends", "/my/myfriends.aspx", c.bookmarks);
    bookmark("Account Details", "/account/default.aspx", c.bookmarks);
    bookmark("Public Profile", "/profile/", c.bookmarks);
    bookmark("Search GC (old adv.)", "/seek/nearest.aspx", c.bookmarks);
    bookmark("Routes", "/my/userroutes.aspx#find", c.bookmarks);
    bookmark("Drafts Upload", "/my/uploadfieldnotes.aspx", c.bookmarks);
    bookmark("Pocket Queries", "/pocket/default.aspx", c.bookmarks);
    bookmark("Pocket Queries Saved", "/pocket/default.aspx#DownloadablePQs", c.bookmarks);
    bookmark("Bookmarks", "/account/lists", c.bookmarks);
    bookmark("Notifications", "/notify/default.aspx", c.bookmarks);
    profileSpecialBookmark("Find Player", defaultFindPlayerLink, "lnk_findplayer", c.bookmarks);
    bookmark("E-Mail", "/email/default.aspx", c.bookmarks);
    bookmark("Statbar", "/my/statbar.aspx", c.bookmarks);
    bookmark("Guidelines", "/about/guidelines.aspx", c.bookmarks);
    profileSpecialBookmark(c.scriptShortNameConfig, "/my/default.aspx#GClhShowConfig", "lnk_gclhconfig", c.bookmarks);
    externalBookmark("Forum Groundspeak", "http://forums.groundspeak.com/", c.bookmarks);
    externalBookmark("Blog Groundspeak", "/blog/", c.bookmarks);
    bookmark("Favorites", "/my/favorites.aspx", c.bookmarks);
    externalBookmark("Geoclub", "http://www.geoclub.de/", c.bookmarks);
    profileSpecialBookmark("Public Profile Geocaches", "/profile/default.aspx?#gclhpb#ctl00_ContentBody_ProfilePanel1_lnkUserStats", "lnk_profilegeocaches", c.bookmarks);
    profileSpecialBookmark("Public Profile Trackables", "/profile/default.aspx?#gclhpb#ctl00_ContentBody_ProfilePanel1_lnkCollectibles", "lnk_profiletrackables", c.bookmarks);
    profileSpecialBookmark("Public Profile Gallery", "/profile/default.aspx?#gclhpb#ctl00_ContentBody_ProfilePanel1_lnkGallery", "lnk_profilegallery", c.bookmarks);
    profileSpecialBookmark("Public Profile Lists", "/profile/default.aspx?#gclhpb#ctl00_ContentBody_ProfilePanel1_lnkLists", "lnk_profilebookmarks", c.bookmarks);
    bookmark("Dashboard", "/my/", c.bookmarks);
    profileSpecialBookmark("Nearest List", "/seek/nearest.aspx?#gclhpb#errhomecoord", "lnk_nearestlist", c.bookmarks);
    profileSpecialBookmark("Nearest Map", "/seek/nearest.aspx?#gclhpb#errhomecoord", "lnk_nearestmap", c.bookmarks);
    profileSpecialBookmark("Nearest List (w/o Founds)", "/seek/nearest.aspx?#gclhpb#errhomecoord", "lnk_nearestlist_wo", c.bookmarks);
    profileSpecialBookmark("Own Trackables", "/track/search.aspx?#gclhpb#errowntrackables", "lnk_my_trackables", c.bookmarks);
    // Custom Bookmarks.
    var num = c.bookmarks.length;
    for (var i = 0; i < c.anzCustom; i++) {
        c.bookmarks[num] = Object();
        if (getValue("settings_custom_bookmark[" + i + "]", "") != "") c.bookmarks[num]['href'] = getValue("settings_custom_bookmark[" + i + "]");
        else c.bookmarks[num]['href'] = "#";
        if (getValue("settings_bookmarks_title[" + num + "]", "") != "") c.bookmarks[num]['title'] = getValue("settings_bookmarks_title[" + num + "]");
        else {
            c.bookmarks[num]['title'] = "Custom" + i;
            setValue("settings_bookmarks_title[" + num + "]", bookmarks[num]['title']);
        }
        if (getValue("settings_custom_bookmark_target[" + i + "]", "") != "") {
            c.bookmarks[num]['target'] = getValue("settings_custom_bookmark_target[" + i + "]");
            c.bookmarks[num]['rel'] = "external";
        } else c.bookmarks[num]['target'] = "";
        c.bookmarks[num]['custom'] = true;
        num++;
    }
    // More Bookmarks.
    profileSpecialBookmark("Public Profile Souvenirs", "/profile/default.aspx?#gclhpb#ctl00_ContentBody_ProfilePanel1_lnkSouvenirs", "lnk_profilesouvenirs", c.bookmarks);
    bookmark("Statistics", "/my/statistics.aspx", c.bookmarks);
    bookmark("Drafts", "/my/fieldnotes.aspx", c.bookmarks);
    profileSpecialBookmark("Public Profile Statistics", "/profile/default.aspx?#gclhpb#ctl00_ContentBody_ProfilePanel1_lnkStatistics", "lnk_profilestatistics", c.bookmarks);
    bookmark("Geocaches RecViewed", "/my/recentlyviewedcaches.aspx", c.bookmarks);
    bookmark("Search TB", "/track/travelbug.aspx", c.bookmarks);
    bookmark("Search Geocoin", "/track/geocoin.aspx", c.bookmarks);
    externalBookmark("Geocaches Labs", "https://labs.geocaching.com/", c.bookmarks);
    bookmark("Search GC", "/play/search/", c.bookmarks);
    bookmark("Geocache Hide", "/play/hide/", c.bookmarks);
    bookmark("Message Center", "/account/messagecenter", c.bookmarks);
    bookmark("Search GC (old)", "/seek/", c.bookmarks);
    bookmark("Glossary of Terms", "/about/glossary.aspx", c.bookmarks);
    bookmark("Event Calendar", "/calendar/", c.bookmarks);
    bookmark("Geocache Adoption", "/adopt/", c.bookmarks);
    externalBookmark("Flopps Karte", "http://flopp-caching.de/", c.bookmarks);
    externalBookmark("Geokrety", "http://geokrety.org/", c.bookmarks);
    externalBookmark("Project Geocaching", "http://project-gc.com/", c.bookmarks);
    bookmark("Search TB adv.", "/track/search.aspx", c.bookmarks);
    bookmark("Map", "/map/", c.bookmarks);
    profileSpecialBookmark(scriptShortNameSync, defaultSyncLink, "lnk_gclhsync", c.bookmarks);
    externalBookmark("Forum Geoclub", "http://geoclub.de/forum/index.php", c.bookmarks);
    externalBookmark("Changelog GClh II", urlChangelog, c.bookmarks);
    bookmark("Lists", "/my/lists.aspx", c.bookmarks);
    bookmark("Souvenirs", "/my/souvenirs.aspx", c.bookmarks);
    bookmark("Leaderboard", "/play/leaderboard", c.bookmarks);
    bookmark("Trackables", "/track/", c.bookmarks);
    bookmark("GeoTours", "/play/geotours", c.bookmarks);
    bookmark("Unpublished Hides", "/account/dashboard/unpublishedcaches", c.bookmarks);
    bookmark("Search Map", "/play/search", c.bookmarks);
    bookmark("Ignore List", "/plan/lists/ignored", c.bookmarks);
    // Custom Bookmark-title.
    c.bookmarks_orig_title = new Array();
    for (var i = 0; i < c.bookmarks.length; i++) {
        if (getValue("settings_bookmarks_title[" + i + "]", "") != "") {
            c.bookmarks_orig_title[i] = c.bookmarks[i]['title'];
            c.bookmarks[i]['title'] = getValue("settings_bookmarks_title[" + i + "]");
        }
    }

    c.gclhConfigKeysIgnoreForBackup = {"declared_version": true, "migration_task_01": true, "update_next_check": true};

    iconsInit(c);
    langInit(c);
    layersInit(c);
    elevationServicesDataInit(c);
    corecssInit(c);
    country_idInit(c);
    states_idInit(c);

    constInitDeref.resolve();
    return constInitDeref.promise();
};

var variablesInit = function(c) {
    var variablesInitDeref = new jQuery.Deferred();

    c.userInfo = c.userInfo || window.userInfo || null;
    c.isLoggedIn = c.isLoggedIn || window.isLoggedIn || null;
    c.userDefinedCoords = c.userDefinedCoords || window.userDefinedCoords || null;
    c.userToken = c.userToken || window.userToken || null;
    c.http = "http";
    if (document.location.href.toLowerCase().indexOf("https") === 0) c.http = "https";
    c.global_dependents = new Array();
    c.global_mod_reset = false;
    c.global_rc_data = "";
    c.global_rc_status = "";
    c.settings_submit_log_button = getValue("settings_submit_log_button", true);
    c.settings_log_inline = getValue("settings_log_inline", false);
    c.settings_log_inline_tb = getValue("settings_log_inline_tb", false);
    c.settings_log_inline_pmo4basic = getValue("settings_log_inline_pmo4basic", true);
    c.settings_bookmarks_show = getValue("settings_bookmarks_show", true);
    c.settings_change_header_layout = getValue("settings_change_header_layout", true);
    c.settings_fixed_header_layout = getValue("settings_fixed_header_layout", false);
    c.settings_remove_logo = getValue("settings_remove_logo", false);
    c.settings_remove_message_in_header = getValue("settings_remove_message_in_header", false);
    c.settings_bookmarks_on_top = getValue("settings_bookmarks_on_top", true);
    c.settings_bookmarks_top_menu = getValue("settings_bookmarks_top_menu", "true");
    c.settings_bookmarks_search = getValue("settings_bookmarks_search", "true");
    c.settings_bookmarks_search_default = getValue("settings_bookmarks_search_default", "");
    c.settings_redirect_to_map = getValue("settings_redirect_to_map", false);
    c.settings_new_width = getValue("settings_new_width", 1000);
    c.settings_hide_facebook = getValue("settings_hide_facebook", true);
    c.settings_hide_socialshare = getValue("settings_hide_socialshare", true);
    c.settings_hide_disclaimer = getValue("settings_hide_disclaimer", true);
    c.settings_hide_cache_notes = getValue("settings_hide_cache_notes", false);
    c.settings_adapt_height_cache_notes = getValue("settings_adapt_height_cache_notes", true);
    c.settings_hide_empty_cache_notes = getValue("settings_hide_empty_cache_notes", true);
    c.settings_show_all_logs = getValue("settings_show_all_logs", true);
    c.settings_show_all_logs_count = getValue("settings_show_all_logs_count", "30");
    c.settings_decrypt_hint = getValue("settings_decrypt_hint", true);
    c.settings_visitCount_geocheckerCom = getValue("settings_visitCount_geocheckerCom", true);
    c.settings_show_bbcode = getValue("settings_show_bbcode", true);
    c.settings_show_mail = getValue("settings_show_mail", true);
    c.settings_font_size_menu = getValue("settings_font_size_menu", 16);
    c.settings_font_size_submenu = getValue("settings_font_size_submenu", 15);
    c.settings_distance_menu = getValue("settings_distance_menu", 16);
    c.settings_distance_submenu = getValue("settings_distance_submenu", 8);
    c.settings_font_color_menu_submenu = getValue("settings_font_color_menu_submenu", "93B516");
    c.settings_font_color_menu = getValue("settings_font_color_menu", getValue("settings_font_color_menu_submenu", "93B516"));
    c.settings_font_color_submenu = getValue("settings_font_color_submenu", getValue("settings_font_color_menu_submenu", "93B516"));
    c.settings_menu_number_of_lines = getValue("settings_menu_number_of_lines", 1);
    c.settings_menu_show_separator = getValue("settings_menu_show_separator", false);
    c.settings_menu_float_right = getValue("settings_menu_float_right", false);
    c.settings_gc_tour_is_working = getValue("settings_gc_tour_is_working", false);
    c.settings_show_smaller_gc_link = getValue("settings_show_smaller_gc_link", true);
    c.settings_show_message = getValue("settings_show_message", true);
    c.settings_show_remove_ignoring_link = getValue("settings_show_remove_ignoring_link", true);
    c.settings_use_one_click_ignoring = getValue("settings_use_one_click_ignoring", true);
    c.settings_use_one_click_watching = getValue("settings_use_one_click_watching", true);
    c.settings_show_common_lists_in_zebra = getValue("settings_show_common_lists_in_zebra", true);
    c.settings_show_common_lists_color_user = getValue("settings_show_common_lists_color_user", true);
    c.settings_show_cache_listings_in_zebra = getValue("settings_show_cache_listings_in_zebra", false);
    c.settings_show_cache_listings_color_user = getValue("settings_show_cache_listings_color_user", true);
    c.settings_show_cache_listings_color_owner = getValue("settings_show_cache_listings_color_owner", true);
    c.settings_show_cache_listings_color_reviewer = getValue("settings_show_cache_listings_color_reviewer", true);
    c.settings_show_cache_listings_color_vip = getValue("settings_show_cache_listings_color_vip", true);
    c.settings_show_tb_listings_in_zebra = getValue("settings_show_tb_listings_in_zebra", true);
    c.settings_show_tb_listings_color_user = getValue("settings_show_tb_listings_color_user", true);
    c.settings_show_tb_listings_color_owner = getValue("settings_show_tb_listings_color_owner", true);
    c.settings_show_tb_listings_color_reviewer = getValue("settings_show_tb_listings_color_reviewer", true);
    c.settings_show_tb_listings_color_vip = getValue("settings_show_tb_listings_color_vip", true);
    c.settings_lines_color_zebra = getValue("settings_lines_color_zebra", "EBECED");
    c.settings_lines_color_user = getValue("settings_lines_color_user", "C2E0C3");
    c.settings_lines_color_owner = getValue("settings_lines_color_owner", "E0E0C3");
    c.settings_lines_color_reviewer = getValue("settings_lines_color_reviewer", "EAD0C3");
    c.settings_lines_color_vip = getValue("settings_lines_color_vip", "F0F0A0");
    c.settings_show_mail_in_allmyvips = getValue("settings_show_mail_in_allmyvips", true);
    c.settings_show_mail_in_viplist = getValue("settings_show_mail_in_viplist", true);
    c.settings_process_vup = getValue("settings_process_vup", true);
    c.settings_show_vup_friends = getValue("settings_show_vup_friends", false);
    c.settings_vup_hide_avatar = getValue("settings_vup_hide_avatar", false);
    c.settings_vup_hide_log = getValue("settings_vup_hide_log", false);
    c.settings_f2_save_gclh_config = getValue("settings_f2_save_gclh_config", true);
    c.settings_esc_close_gclh_config = getValue("settings_esc_close_gclh_config", true);
    c.settings_f4_call_gclh_config = getValue("settings_f4_call_gclh_config", true);
    c.settings_f10_call_gclh_sync = getValue("settings_f10_call_gclh_sync", true);
    c.settings_show_sums_in_bookmark_lists = getValue("settings_show_sums_in_bookmark_lists", true);
    c.settings_show_sums_in_watchlist = getValue("settings_show_sums_in_watchlist", true);
    c.settings_hide_warning_message = getValue("settings_hide_warning_message", true);
    c.settings_show_save_message = getValue("settings_show_save_message", true);
    c.settings_map_overview_build = getValue("settings_map_overview_build", true);
    c.settings_map_overview_zoom = getValue("settings_map_overview_zoom", 11);
    c.settings_map_overview_layer = getValue("settings_map_overview_layer", "Geocaching");
    c.settings_logit_for_basic_in_pmo = getValue("settings_logit_for_basic_in_pmo", true);
    c.settings_log_statistic = getValue("settings_log_statistic", true);
    c.settings_log_statistic_percentage = getValue("settings_log_statistic_percentage", true);
    c.settings_log_statistic_reload = getValue("settings_log_statistic_reload", 8);
    c.settings_count_own_matrix = getValue("settings_count_own_matrix", true);
    c.settings_count_foreign_matrix = getValue("settings_count_foreign_matrix", true);
    c.settings_count_own_matrix_show_next = getValue("settings_count_own_matrix_show_next", true);
    c.settings_count_own_matrix_show_count_next = getValue("settings_count_own_matrix_show_count_next", 2);
    c.settings_count_own_matrix_show_color_next = getValue("settings_count_own_matrix_show_color_next", "5151FB");
    c.settings_count_own_matrix_links_radius = getValue("settings_count_own_matrix_links_radius", 25);
    c.settings_count_own_matrix_links = getValue("settings_count_own_matrix_links", "map");
    c.settings_hide_left_sidebar_on_google_maps = getValue("settings_hide_left_sidebar_on_google_maps", true);
    c.settings_add_link_gc_map_on_google_maps = getValue("settings_add_link_gc_map_on_google_maps", true);
    c.settings_switch_to_gc_map_in_same_tab = getValue("settings_switch_to_gc_map_in_same_tab", false);
    c.settings_add_link_google_maps_on_gc_map = getValue("settings_add_link_google_maps_on_gc_map", true);
    c.settings_switch_to_google_maps_in_same_tab = getValue("settings_switch_to_google_maps_in_same_tab", false);
    c.settings_add_link_gc_map_on_osm = getValue("settings_add_link_gc_map_on_osm", true);
    c.settings_switch_from_osm_to_gc_map_in_same_tab = getValue("settings_switch_from_osm_to_gc_map_in_same_tab", false);
    c.settings_add_link_osm_on_gc_map = getValue("settings_add_link_osm_on_gc_map", true);
    c.settings_switch_to_osm_in_same_tab = getValue("settings_switch_to_osm_in_same_tab", false);
    c.settings_add_link_flopps_on_gc_map = getValue("settings_add_link_flopps_on_gc_map", true);
    c.settings_switch_to_flopps_in_same_tab = getValue("settings_switch_to_flopps_in_same_tab", false);
    c.settings_add_link_geohack_on_gc_map = getValue("settings_add_link_geohack_on_gc_map", true);
    c.settings_switch_to_geohack_in_same_tab = getValue("settings_switch_to_geohack_in_same_tab", false);
    c.settings_sort_default_bookmarks = getValue("settings_sort_default_bookmarks", true);
    c.settings_make_vip_lists_hideable = getValue("settings_make_vip_lists_hideable", true);
    c.settings_show_latest_logs_symbols = getValue("settings_show_latest_logs_symbols", true);
    c.settings_show_latest_logs_symbols_count = getValue("settings_show_latest_logs_symbols_count", 5);
    c.settings_set_default_langu = getValue("settings_set_default_langu", false);
    c.settings_default_langu = getValue("settings_default_langu", "English");
    c.settings_hide_colored_versions = getValue("settings_hide_colored_versions", false);
    c.settings_make_config_main_areas_hideable = getValue("settings_make_config_main_areas_hideable", true);
    c.settings_faster_profile_trackables = getValue("settings_faster_profile_trackables", false);
    c.settings_show_eventday = getValue("settings_show_eventday", true);
    c.settings_show_google_maps = getValue("settings_show_google_maps", true);
    c.settings_show_log_it = getValue("settings_show_log_it", true);
    c.settings_show_nearestuser_profil_link = getValue("settings_show_nearestuser_profil_link", true);
    c.settings_show_homezone = getValue("settings_show_homezone", true);
    c.settings_homezone_radius = getValue("settings_homezone_radius", "10");
    c.settings_homezone_color = getValue("settings_homezone_color", "#0000FF");
    c.settings_homezone_opacity = getValue("settings_homezone_opacity", 10);
    c.settings_multi_homezone = JSON.parse(getValue("settings_multi_homezone", "{}"));
    c.settings_show_hillshadow = getValue("settings_show_hillshadow", false);
    c.settings_map_layers = getValue("settings_map_layers", "").split("###");
    c.map_url = "https://www.geocaching.com/map/default.aspx";
    c.settings_default_logtype = getValue("settings_default_logtype", "-1");
    c.settings_default_logtype_event = getValue("settings_default_logtype_event", c.settings_default_logtype);
    c.settings_default_logtype_owner = getValue("settings_default_logtype_owner", c.settings_default_logtype);
    c.settings_default_tb_logtype = getValue("settings_default_tb_logtype", "-1");
    c.settings_bookmarks_list = JSON.parse(getValue("settings_bookmarks_list", JSON.stringify(c.bookmarks_def)).replace(/, (?=,)/g, ",null"));
    if (c.settings_bookmarks_list.length == 0) c.settings_bookmarks_list = c.bookmarks_def;
    c.settings_sync_last = new Date(getValue("settings_sync_last", "Thu Jan 01 1970 01:00:00 GMT+0100 (Mitteleuropäische Zeit)"));
    c.settings_sync_hash = getValue("settings_sync_hash", "");
    c.settings_sync_time = getValue("settings_sync_time", 36000000);  // 10 Stunden
    c.settings_sync_autoImport = getValue("settings_sync_autoImport", false);
    c.settings_hide_advert_link = getValue('settings_hide_advert_link', true);
    c.settings_hide_spoilerwarning = getValue('settings_hide_spoilerwarning', true);
    c.settings_hide_hint = getValue('settings_hide_hint', true);
    c.settings_strike_archived = getValue('settings_strike_archived', true);
    c.settings_highlight_usercoords = getValue('settings_highlight_usercoords', true);
    c.settings_highlight_usercoords_bb = getValue('settings_highlight_usercoords_bb', false);
    c.settings_highlight_usercoords_it = getValue('settings_highlight_usercoords_it', true);
    c.settings_map_hide_found = getValue('settings_map_hide_found', true);
    c.settings_map_hide_hidden = getValue('settings_map_hide_hidden', true);
    c.settings_map_hide_dnfs = getValue('settings_map_hide_dnfs', true);
    c.settings_map_hide_2 = getValue('settings_map_hide_2', false);
    c.settings_map_hide_9 = getValue('settings_map_hide_9', false);
    c.settings_map_hide_5 = getValue('settings_map_hide_5', false);
    c.settings_map_hide_3 = getValue('settings_map_hide_3', false);
    c.settings_map_hide_6 = getValue('settings_map_hide_6', false);
    c.settings_map_hide_453 = getValue('settings_map_hide_453', false);
    c.settings_map_hide_7005 = getValue('settings_map_hide_7005', false);
    c.settings_map_hide_13 = getValue('settings_map_hide_13', false);
    c.settings_map_hide_1304 = getValue('settings_map_hide_1304', false);
    c.settings_map_hide_4 = getValue('settings_map_hide_4', false);
    c.settings_map_hide_11 = getValue('settings_map_hide_11', false);
    c.settings_map_hide_137 = getValue('settings_map_hide_137', false);
    c.settings_map_hide_8 = getValue('settings_map_hide_8', false);
    c.settings_map_hide_1858 = getValue('settings_map_hide_1858', false);
    c.settings_show_fav_percentage = getValue('settings_show_fav_percentage', true);
    c.settings_show_vip_list = getValue('settings_show_vip_list', true);
    c.settings_show_owner_vip_list = getValue('settings_show_owner_vip_list', true);
    c.settings_autovisit = getValue("settings_autovisit", "true");
    c.settings_show_thumbnails = getValue("settings_show_thumbnails", true);
    c.settings_imgcaption_on_top = getValue("settings_imgcaption_on_top", false);
    c.settings_hide_avatar = getValue("settings_hide_avatar", false);
    c.settings_link_big_listing = getValue("settings_link_big_listing", true);
    c.settings_show_big_gallery = getValue("settings_show_big_gallery", false);
    c.settings_automatic_friend_reset = getValue("settings_automatic_friend_reset", false);
    c.settings_show_long_vip = getValue("settings_show_long_vip", false);
    c.settings_load_logs_with_gclh = getValue("settings_load_logs_with_gclh", true);
    c.settings_map_add_layer = getValue("settings_map_add_layer", true);
    c.settings_map_default_layer = getValue("settings_map_default_layer", "OpenStreetMap Default");
    c.settings_hide_map_header = getValue("settings_hide_map_header", false);
    c.settings_spoiler_strings = getValue("settings_spoiler_strings", "spoiler|hinweis");
    c.settings_replace_log_by_last_log = getValue("settings_replace_log_by_last_log", false);
    c.settings_hide_top_button = getValue("settings_hide_top_button", false);
    c.settings_show_real_owner = getValue("settings_show_real_owner", false);
    c.settings_hide_archived_in_owned = getValue("settings_hide_archived_in_owned", false);
    c.settings_hide_visits_in_profile = getValue("settings_hide_visits_in_profile", false);
    c.settings_log_signature_on_fieldnotes = getValue("settings_log_signature_on_fieldnotes", true);
    c.settings_map_hide_sidebar = getValue("settings_map_hide_sidebar", true);
    c.settings_hover_image_max_size = getValue("settings_hover_image_max_size", 600);
    c.settings_vip_show_nofound = getValue("settings_vip_show_nofound", true);
    c.settings_use_gclh_layercontrol = getValue("settings_use_gclh_layercontrol", true);
    c.settings_fixed_pq_header = getValue("settings_fixed_pq_header", true);
    c.settings_friendlist_summary = getValue("settings_friendlist_summary", true);
    c.settings_friendlist_summary_viponly = getValue("settings_friendlist_summary_viponly", false);
    c.settings_search_data = JSON.parse(getValue("settings_search_data", "[]"));
    c.settings_search_enable_user_defined = getValue("settings_search_enable_user_defined",true);
    c.settings_pq_warning = getValue("settings_pq_warning",true);
    c.settings_pq_set_cachestotal = getValue("settings_pq_set_cachestotal",true);
    c.settings_pq_cachestotal = getValue("settings_pq_cachestotal",1000);
    c.settings_pq_option_ihaventfound = getValue("settings_pq_option_ihaventfound",true);
    c.settings_pq_option_idontown = getValue("settings_pq_option_idontown",true);
    c.settings_pq_option_ignorelist = getValue("settings_pq_option_ignorelist",true);
    c.settings_pq_option_isenabled = getValue("settings_pq_option_isenabled",true);
    c.settings_pq_option_filename = getValue("settings_pq_option_filename",true);
    c.settings_pq_set_terrain = getValue("settings_pq_set_terrain",true);
    c.settings_pq_set_difficulty = getValue("settings_pq_set_difficulty",true);
    c.settings_pq_difficulty = getValue("settings_pq_difficulty",">=");
    c.settings_pq_difficulty_score = getValue("settings_pq_difficulty_score","1");
    c.settings_pq_terrain = getValue("settings_pq_terrain",">=");
    c.settings_pq_terrain_score = getValue("settings_pq_terrain_score","1");
    c.settings_pq_automatically_day = getValue("settings_pq_automatically_day",false);
    c.settings_pq_previewmap = getValue("settings_pq_previewmap",true);
    c.settings_pq_previewmap_layer = getValue("settings_pq_previewmap_layer","Geocaching");
    c.settings_mail_icon_new_win = getValue("settings_mail_icon_new_win",false);
    c.settings_message_icon_new_win = getValue("settings_message_icon_new_win",false);
    c.settings_hide_cache_approvals = getValue("settings_hide_cache_approvals", true);
    c.settings_driving_direction_link = getValue("settings_driving_direction_link",true);
    c.settings_driving_direction_parking_area = getValue("settings_driving_direction_parking_area",false);
    c.settings_show_elevation_of_waypoints = getValue("settings_show_elevation_of_waypoints", true);
    c.settings_primary_elevation_service = getValue("settings_primary_elevation_service", 3);
    c.settings_secondary_elevation_service = getValue("settings_secondary_elevation_service", 2);
    c.settings_distance_units = getValue("settings_distance_units", "");
    c.settings_img_warning = getValue("settings_img_warning", false);
    c.settings_fieldnotes_old_fashioned = getValue("settings_fieldnotes_old_fashioned", false);
    c.settings_remove_banner = getValue("settings_remove_banner", false);
    c.settings_remove_banner_for_garminexpress = getValue("settings_remove_banner_for_garminexpress", false);
    c.settings_remove_banner_blue = getValue("settings_remove_banner_blue", false);
    c.settings_compact_layout_bm_lists = getValue("settings_compact_layout_bm_lists", true);
    c.settings_compact_layout_pqs = getValue("settings_compact_layout_pqs", true);
    c.settings_compact_layout_list_of_pqs = getValue("settings_compact_layout_list_of_pqs", true);
    c.settings_compact_layout_nearest = getValue("settings_compact_layout_nearest", true);
    c.settings_compact_layout_recviewed = getValue("settings_compact_layout_recviewed", true);
    c.settings_map_links_statistic = getValue("settings_map_links_statistic", true);
    c.settings_improve_add_to_list_height = getValue("settings_improve_add_to_list_height", 205);
    c.settings_improve_add_to_list = getValue("settings_improve_add_to_list", true);
    c.remove_navi_play = getValue("remove_navi_play", false);
    c.remove_navi_community = getValue("remove_navi_community", false);
    c.remove_navi_shop = getValue("remove_navi_shop", false);
    c.settings_show_flopps_link = getValue("settings_show_flopps_link", true);
    c.settings_show_brouter_link = getValue("settings_show_brouter_link", true);
    c.settings_show_gpsvisualizer_link = getValue("settings_show_gpsvisualizer_link", true);
    c.settings_show_gpsvisualizer_gcsymbols = getValue("settings_show_gpsvisualizer_gcsymbols", true);
    c.settings_show_gpsvisualizer_typedesc = getValue("settings_show_gpsvisualizer_typedesc", true);
    c.settings_show_openrouteservice_link = getValue("settings_show_openrouteservice_link", true);
    c.settings_show_openrouteservice_home = getValue("settings_show_openrouteservice_home", false);
    c.settings_show_openrouteservice_medium = getValue("settings_show_openrouteservice_medium", "2b");
    c.settings_show_copydata_menu = getValue("settings_show_copydata_menu", true);
    c.settings_show_default_links = getValue("settings_show_default_links", true);
    c.settings_bm_changed_and_go = getValue("settings_bm_changed_and_go", true);
    c.settings_bml_changed_and_go = getValue("settings_bml_changed_and_go", true);
    c.settings_show_tb_inv = getValue("settings_show_tb_inv", true);
    c.settings_but_search_map = getValue("settings_but_search_map", true);
    c.settings_but_search_map_new_tab = getValue("settings_but_search_map_new_tab", false);
    c.settings_show_pseudo_as_owner = getValue("settings_show_pseudo_as_owner", true);
    c.settings_fav_proz_pqs = getValue("settings_fav_proz_pqs", true);
    c.settings_fav_proz_nearest = getValue("settings_fav_proz_nearest", true);
    c.settings_fav_proz_recviewed = getValue("settings_fav_proz_recviewed", true);
    c.settings_show_all_logs_but = getValue("settings_show_all_logs_but", true);
    c.settings_show_log_counter_but = getValue("settings_show_log_counter_but", true);
    c.settings_show_log_counter = getValue("settings_show_log_counter", false);
    c.settings_show_bigger_avatars_but = getValue("settings_show_bigger_avatars_but", true);
    c.settings_hide_feedback_icon = getValue("settings_hide_feedback_icon", false);
    c.settings_compact_layout_new_dashboard = getValue("settings_compact_layout_new_dashboard", false);
    c.settings_show_draft_indicator = getValue("settings_show_draft_indicator", true);
    c.settings_show_enhanced_map_popup = getValue("settings_show_enhanced_map_popup", true);
    c.settings_show_latest_logs_symbols_count_map = getValue("settings_show_latest_logs_symbols_count_map", 10);
    c.settings_modify_new_drafts_page = getValue("settings_modify_new_drafts_page", true);
    c.settings_gclherror_alert = getValue("settings_gclherror_alert", false);
    c.settings_auto_open_tb_inventory_list = getValue("settings_auto_open_tb_inventory_list", true);
    c.settings_embedded_smartlink_ignorelist = getValue("settings_embedded_smartlink_ignorelist", true);
    c.settings_both_tabs_list_of_pqs_one_page = getValue("settings_both_tabs_list_of_pqs_one_page", false);
    c.settings_past_events_on_bm = getValue("settings_past_events_on_bm", true);
    c.settings_show_log_totals = getValue("settings_show_log_totals", true);
    c.settings_show_reviewer_as_vip = getValue("settings_show_reviewer_as_vip", true);
    c.settings_hide_found_count = getValue("settings_hide_found_count", false);
    c.settings_show_compact_logbook_but = getValue("settings_show_compact_logbook_but", true);
    c.settings_log_status_icon_visible = getValue("settings_log_status_icon_visible", true);
    c.settings_cache_type_icon_visible = getValue("settings_cache_type_icon_visible", true);
    c.settings_compactLayout_unpublishedList = getValue("settings_compactLayout_unpublishedList", true);
    c.settings_set_compactLayoutUnpublishedHides_sort = getValue("settings_set_compactLayoutUnpublishedHides_sort", true);
    c.settings_compactLayoutUnpublishedHides_sort = getValue("settings_compactLayoutUnpublishedHides_sort", "abc");
    c.settings_showUnpublishedHides = getValue("settings_showUnpublishedHides", true);
    c.settings_set_showUnpublishedHides_sort = getValue("settings_set_showUnpublishedHides_sort", true);
    c.settings_showUnpublishedHides_sort = getValue("settings_showUnpublishedHides_sort", "abc");
    c.settings_lists_compact_layout = getValue("settings_lists_compact_layout", false);
    c.settings_lists_disabled = getValue("settings_lists_disabled", false);
    c.settings_lists_disabled_color = getValue("settings_lists_disabled_color", "4A4A4A");
    c.settings_lists_disabled_strikethrough = getValue("settings_lists_disabled_strikethrough", true);
    c.settings_lists_archived = getValue("settings_lists_archived", false);
    c.settings_lists_archived_color = getValue("settings_lists_archived_color", "8C0B0B");
    c.settings_lists_archived_strikethrough = getValue("settings_lists_archived_strikethrough", true);
    c.settings_lists_icons_visible = getValue("settings_lists_icons_visible", false);
    c.settings_lists_log_status_icons_visible = getValue("settings_lists_log_status_icons_visible", true);
    c.settings_lists_cache_type_icons_visible = getValue("settings_lists_cache_type_icons_visible", true);
    c.settings_lists_premium_column = getValue("settings_lists_premium_column", false);
    c.settings_lists_found_column_bml = getValue("settings_lists_found_column_bml", false);
    c.settings_lists_show_log_it = getValue("settings_lists_show_log_it", false);
    c.settings_lists_back_to_top = getValue("settings_lists_back_to_top", false);
    c.settings_searchmap_autoupdate_after_dragging = getValue("settings_searchmap_autoupdate_after_dragging", true);

    try {
        if (c.userToken === null) {
            c.userData = $('#aspnetForm script:not([src])').filter(function() {
                return this.innerHTML.indexOf("ccConversions") != -1;
            }).html();
            if (c.userData !== null) {
                if (typeof c.userData !== "undefined") {
                    c.userData = c.userData.replace('{ID: ', '{"ID": ');
                    var regex = /([a-zA-Z0-9öÖäÄüÜß]+)([ ]?=[ ]?)(((({.+})(;)))|(((\[.+\])(;)))|(((".+")(;)))|((('.+')(;)))|(([^'"{\[].+)(;)))/g;
                    var match;
                    while (match = regex.exec(userData)) {
                        if (match[1] == "eventCacheData") continue;
                        var data = (match[6] || match[10] || match[14] || match[18] || match[21]).trim();
                        if (data.charAt(0) == '"' || data.charAt(0) == "'") data = data.slice(1, data.length - 1);
                        data = data.trim();
                        if (data.charAt(0) == '{' || data.charAt(0) == '[') data = JSON.parse(data);
                        if (typeof c.chromeUserData === "undefined") c.chromeUserData = {};
                        c.chromeUserData[match[1].replace('"', '').replace("'", "").trim()] = data;
                    }
                    if (c.chromeUserData["userInfo"]) c.userInfo = chromeUserData["userInfo"];
                    if (c.chromeUserData["isLoggedIn"]) c.isLoggedIn = chromeUserData["isLoggedIn"];
                    if (c.chromeUserData["userDefinedCoords"]) c.userDefinedCoords = c.chromeUserData["userDefinedCoords"];
                    if (c.chromeUserData["userToken"]) c.userToken = c.chromeUserData["userToken"];
                }
            }
        }
    } catch(e) {gclh_error("Error parsing userdata from page",e);}

    variablesInitDeref.resolve();
    return variablesInitDeref.promise();
};

//////////////////////////////
// Google Maps
//////////////////////////////
var mainGMaps = function() {
    try {
        // Add link to GC Map on Google Maps page.
        if (settings_add_link_gc_map_on_google_maps) {
            function addGcButton(waitCount) {
                if (document.getElementById("gbwa")) {
                    var code = "";
                    code += "function openGcMap(){";
                    code += "  var matches = document.location.href.match(/@(-?[0-9.]*),(-?[0-9.]*),([0-9.]*)z/);";
                    code += "  if (matches != null) {";
                    code += "    var zoom = matches[3];";
                    code += "  } else {";
                    // Bei Earth gibt es kein z für Zoom sondern ein m für Meter. Meter in Zoom umrechnen.
                    code += "    var matches = document.location.href.match(/@(-?[0-9.]*),(-?[0-9.]*),([0-9.]*)m/);";
                    code += "    if (matches != null) {";
                    code += "      var zoom = 26 - Math.round(Math.log2(matches[3]));";
                    code += "    }";
                    code += "  }";
                    code += "  if (matches != null) {";
                    code += "    var matchesMarker = document.location.href.match(/!3d(-?[0-9.]*)!4d(-?[0-9.]*)/);";
                    code += "    if (matchesMarker != null) {";
                    code += "      var url = '" + map_url + "?lat=' + matchesMarker[1] + '&lng=' + matchesMarker[2] + '#?ll=' + matches[1] + ',' + matches[2] + '&z=' + zoom;";
                    code += "    } else {";
                    code += "      var url = '" + map_url + "?lat=' + matches[1] + '&lng=' + matches[2] + '&z=' + zoom;";
                    code += "    }";
                    if (settings_switch_to_gc_map_in_same_tab) {
                        code += "  location = url;";
                    } else {
                        code += "  window.open(url);";
                    }
                    code += "  } else {";
                    code += "    alert('This map has no geographical coordinates in its link. Just zoom or drag the map, afterwards this will work fine.');";
                    code += "  }";
                    code += "}";
                    var script = document.createElement("script");
                    script.innerHTML = code;
                    var div = document.createElement("div");
                    div.setAttribute("style", "display: inline-block; vertical-align: middle;");
                    var aTag = document.createElement("a");
                    aTag.setAttribute("onClick", "openGcMap();");
                    aTag.setAttribute("title", "Geocaching Map");
                    var url = "url('" + http + "://www.geocaching.com/images/about/logos/geocaching/Logo_Geocaching_color_notext_32.png')";
                    aTag.setAttribute("style", "display: inline-block; vertical-align: middle; height: 32px; width: 32px; background-image: " + url + ";");
                    var side = document.getElementById("gbwa").parentNode;
                    div.appendChild(script);
                    div.appendChild(aTag);
                    side.parentNode.insertBefore(div, side);
                } else {waitCount++; if (waitCount <= 50) setTimeout(function(){addGcButton(waitCount);}, 200);}
            }
            addGcButton(0);
        }
        // Hide left sidebar on Google Maps.
        if (settings_hide_left_sidebar_on_google_maps) {
            function hideLeftSidebar(waitCount) {
                if ($('#gbwa')[0] && $('.widget-pane-toggle-button')[0] && $('.widget-pane')[0]) {
                    if (!$('.widget-pane')[0].className.match("widget-pane-collapsed")) $('.widget-pane-toggle-button')[0].click();
                } else {waitCount++; if (waitCount <= 60) setTimeout(function(){hideLeftSidebar(waitCount);}, 250);}
            }
            hideLeftSidebar(0);
        }
    } catch(e) {gclh_error("mainGMaps",e);}
};

//////////////////////////////
// Project GC
//////////////////////////////
var mainPGC = function() {
    try {
        // CSS Style hinzufügen.
        function appendCssStyle(css, name) {
            if (css == "") return;
            if (name) var tag = $(name)[0];
            else var tag = $('head')[0];
            var style = document.createElement('style');
            style.innerHTML = 'GClhII{} ' + css;
            style.type = 'text/css';
            tag.appendChild(style);
        }

        function createRadioElement( name, id = false, checked = false ) {
            var radioInput;
            try {
                var radioHtml = '<input type="radio" name="' + name + '"';
                if ( checked ) {
                    radioHtml += ' checked="checked"';
                }
                if (id) {
                    radioHtml += ' id="' + id + '"';
                }
                radioHtml += '/>';
                radioInput = document.createElement(radioHtml);
            } catch( err ) {
                radioInput = document.createElement('input');
                radioInput.setAttribute('type', 'radio');
                radioInput.setAttribute('name', name);
                if ( checked ) {
                    radioInput.setAttribute('checked', 'checked');
                }
                if ( id ) {
                    radioInput.setAttribute('id', id);
                }
            }

            return radioInput;
        }

        function getMonthNumber(lang, input){
            if(lang = 'DE'){
                if(input == 'Januar') return 1;
                if(input == 'Februar') return 2;
                if(input == 'März') return 3;
                if(input == 'April') return 4;
                if(input == 'Mai') return 5;
                if(input == 'Juni') return 6;
                if(input == 'Juli') return 7;
                if(input == 'August') return 8;
                if(input == 'September') return 9;
                if(input == 'Oktober') return 10;
                if(input == 'November') return 11;
                if(input == 'Dezember') return 12;
            }

            if(lang = 'EN'){
                if(input == 'January') return 1;
                if(input == 'February') return 2;
                if(input == 'March') return 3;
                if(input == 'April') return 4;
                if(input == 'May') return 5;
                if(input == 'June') return 6;
                if(input == 'July') return 7;
                if(input == 'August') return 8;
                if(input == 'September') return 9;
                if(input == 'October') return 10;
                if(input == 'November') return 11;
                if(input == 'December') return 12;
            }

            return false;
        }

        var open_popup_count = 0;
        var open_popups = null;
        function create_pqs(first_run = true){

            if(first_run){
                // Cleanup last run (if there is one!)
                if((open_popups != null) && (Array.isArray(open_popups))){
                    for (var i = 0; i < open_popups.length; i++) {
                        if(typeof open_popups[i] !== 'undefined' && open_popups[i] !== false){
                            open_popups[i].close();
                        }
                    }
                }

                open_popups = new Array(urls_for_pqs_to_create.length);
                open_popup_count = 0;
            }

            var already_done_count = 0;

            for (var i = 0; i < urls_for_pqs_to_create.length; i++) {
                if(urls_for_pqs_to_create[i] != ''){
                    if(open_popup_count < 5){
                        open_popups[i] = window.open(urls_for_pqs_to_create[i],'PQ_'+i,'scrollbars=1,menubar=0,resizable=1,width=500,height=500,left='+(i*40));
                        urls_for_pqs_to_create[i] = '';
                        open_popup_count++;
                    }
                }else{
                    already_done_count++;
                }

                if(typeof open_popups[i] !== 'undefined' && open_popups[i] !== false && open_popups[i].closed){
                    open_popup_count--;
                    open_popups[i] = false;
                }
            }

            if(
                (already_done_count < urls_for_pqs_to_create.length) ||
                (open_popup_count > 0)
            ){
                // Restart function until everything is finished
                setTimeout(function(){create_pqs(false);}, 1000);
            }else{
                alert('We are done creating the Pocket Querys.');
                $("button[data='PQCreateButton']").prop("disabled",false);
            }
        }

        if($('.row table').length > 0){

            // Add some CSS
            var css = "";
                css += "tfoot{";
                css += "    background-color: #d4edda;";
                css += "}";

            appendCssStyle(css);

            var urls_for_pqs_to_create = [];

            // Only one of the Multiselects has a value. Either the Country or the Region

            // Check if other Filters are set!

            var error_text = '';

            if($('#inputlist li').length > 1){
                error_text = "More than one filter was set! You can not use this function. Please remove all filters except country/region.";
            }

            if($('#multi_countryselect').val() != null){
                name = $('#multi_countryselect').val();
                type = "country";
            }else if($('#multi_countryregionselect').val() != null){
                name = $('#multi_countryregionselect').val();
                type = "region";
            }else{
                error_text = 'No Country/Region selected.';
            }

            $('.row table').each(function(table_index){
                var tfoot = document.createElement('tfoot');
                var tr = document.createElement('tr');
                var td = document.createElement('td');
                td.colSpan = "5";

                var heading = document.createElement("h4");
                heading.appendChild(document.createTextNode("Create PQ(s) on geocaching.com"));

                var info_text = document.createElement("span");
                info_text.appendChild(heading);

                // Check if we need to add the function, or if we have an error before
                if(error_text != ''){
                    info_text.appendChild(document.createTextNode(error_text));
                    td.appendChild(info_text);
                    tr.appendChild(td);
                    tfoot.appendChild(tr);
                    $(this).append(tfoot);
                    return;
                }

                info_text.appendChild(document.createTextNode("PQ-Name (Prefix):"));

                var button = document.createElement('button');
                var t = document.createTextNode("Create PQ(s)");
                button.appendChild(t);
                button.setAttribute("data", "PQCreateButton");

                var input = document.createElement("input");
                input.setAttribute("type", "text");
                input.setAttribute("value", "PQName");
                input.setAttribute("id", "pq_name_"+table_index);

                button.addEventListener("click", function(){
                    var current_table = $(this).closest('table');
                    var counter = 0;
                    var language;
                    var data = new Array();

                    // Cleanup old Data (if there is any)
                    urls_for_pqs_to_create = [];

                    $("button[data='PQCreateButton']").prop("disabled",true);

                    $(current_table).find('tr').each(function(){
                        counter++;
                        if(counter == 1){
                            // first tr, determine Language
                            var lang_text = $(this).children().eq(1).text();
                            if(lang_text == 'Startdatum'){
                                language = 'DE';
                            }else if(lang_text == 'Start date'){
                                language = 'EN';
                            }else{
                                // Lang not supported
                                alert('Language not supported. Please switch to German or English to use this funktion');
                                language = 'NONE';
                            }
                        }else{
                            // Other td, here is the Data we need
                            // Only process if the first column has Data in it
                            if($(this).children().eq(1).text() != ""){

                                var start = $(this).children().eq(1).text();
                                var start_array = start.split('/');

                                var start_month = getMonthNumber(language,start_array[0]);
                                var start_day   = parseInt(start_array[1]);
                                var start_year  = parseInt(start_array[2]);

                                var end = $(this).children().eq(2).text();
                                if(end.indexOf("/") != -1){
                                    var end_array = end.split('/');
                                    var end_month = getMonthNumber(language,end_array[0]);
                                    var end_day   = parseInt(end_array[1]);
                                    var end_year  = parseInt(end_array[2]);
                                }else{
                                    var end_month = "";
                                    var end_day   = "";
                                    var end_year  = "";
                                }

                                var cache_count = 1000;
                                if(table_index == 1) cache_count = 500;

                                var pq_name = $("#pq_name_"+table_index).val()+"_"+(counter-1);
                                if(counter <= 10){
                                    pq_name = $("#pq_name_"+table_index).val()+"_0"+(counter-1);
                                }

                                var temp_id = $("input[name=how_often_"+table_index+"]:checked").attr('id');
                                var how_often = temp_id.substr(temp_id.lastIndexOf("_")+1);

                                var email = $("#output_email_"+table_index).val();

                                var param =
                                    {
                                        PQSplit: 1,
                                        n: pq_name,
                                        t: type,
                                        s: name,
                                        c: cache_count,
                                        ho: how_often,
                                        e: email,

                                        sm: start_month,
                                        sd: start_day,
                                        sy: start_year,

                                        em: end_month,
                                        ed: end_day,
                                        ey: end_year

                                    };

                                var new_url = "https://www.geocaching.com/pocket/gcquery.aspx?"+$.param( param );

                                if(new_url.length > 2000){
                                    alert("The URL is too long! Please use fewer countries/regions or you can't use this funciton. Some of the PQs could already be created!");
                                    return false;
                                }else{
                                    urls_for_pqs_to_create.push(new_url);
                                }

                                // Only one for now...
                                // return false;
                            }
                        }
                    });

                    create_pqs();

                }, false);

                td.appendChild(info_text);
                td.appendChild(input);
                td.appendChild(button);

                var heading_instructions = document.createElement("h5");
                heading_instructions.appendChild(document.createTextNode("Instruction"));

                td.appendChild(heading_instructions);
                td.appendChild(document.createTextNode("This function will only work, if you don't set any other filter except country or region!"));
                td.appendChild(document.createElement("br"));
                td.appendChild(document.createTextNode("If you click the \"Create PQ(s)\" Button GClh will open as many Pop-ups as PQs should be created. Please wait until all Pop-ups are loaded. The number of simultaneously loaded Popups is limited to 5. We will display a message if all PQs are created. The Popups will close themselves after the PQs are created. "));

                var span = document.createElement('span');
                span.innerHTML = 'Please make sure you do not have a Pop-up-Blocker enabled. Otherwise this function will not work as expected. ';
                span.style.fontWeight = 'bold';
                td.appendChild(span);

                td.appendChild(document.createTextNode("All PQs will get the Name that you enter in the text field and an ongoing number."));

                var heading_config = document.createElement("h5");
                heading_config.appendChild(document.createTextNode("Configuration"));
                td.appendChild(heading_config);

                td.appendChild(document.createTextNode("Choose how often your query should run:"));
                td.appendChild(document.createElement("br"));

                td.appendChild(createRadioElement('how_often_'+table_index, 'how_often_'+table_index+'_1', true));
                td.appendChild(document.createTextNode(" Uncheck the day of the week after the query runs"));
                td.appendChild(document.createElement("br"));
                td.appendChild(createRadioElement('how_often_'+table_index, 'how_often_'+table_index+'_2', false));
                td.appendChild(document.createTextNode(" Run this query every week on the days checked"));
                td.appendChild(document.createElement("br"));
                td.appendChild(createRadioElement('how_often_'+table_index, 'how_often_'+table_index+'_3', false));
                td.appendChild(document.createTextNode(" Run this query once then delete it"));
                td.appendChild(document.createElement("br"));
                td.appendChild(document.createElement("br"));

                td.appendChild(document.createTextNode("Output to Email:"));
                td.appendChild(document.createElement("br"));

                var output_email = document.createElement("select");
                output_email.setAttribute("id", "output_email_"+table_index);
                output_email.appendChild(new Option("Primary", "1"));
                output_email.appendChild(new Option("Secondary", "2"));
                td.appendChild(output_email);
                td.appendChild(document.createElement("br"));
                td.appendChild(document.createTextNode("Attention: This will only work if you have 2 or more Email addresses in your Profile."));
                td.appendChild(document.createElement("br"));

                tr.appendChild(td);
                tfoot.appendChild(tr);
                $(this).append(tfoot);
            });
        }
    } catch(e) {gclh_error("mainPGC",e);}
};

//////////////////////////////
// Openstreetmap
//////////////////////////////
var mainOSM = function() {
    try {

        // Add link to GC Map on Openstreetmap.
        function addGCButton(waitCount) {
            if (document.location.href.match(/^https?:\/\/www\.openstreetmap\.org\/(.*)#map=/) && $(".control-key").length) {
                if (settings_add_link_gc_map_on_osm) {
                    var code = '<div class="control-gc leaflet-control"><a class="control-button" href="#" data-original-title="Go to GC Map"><img src="'+OSM_sidebar_gc_icon+'" width="40px" height="40px"></a></div>';
                    $(".control-share").after(code);
                    $(".control-gc").click(function() {
                        var matches = document.location.href.match(/=([0-9]+)\/(-?[0-9.]*)\/(-?[0-9.]*)/);
                        if (matches != null) {
                            var url = map_url + '?lat=' + matches[2] + '&lng=' + matches[3] + '#?ll=' + matches[2] + ',' + matches[3] + '&z=' + matches[1];
                            if (settings_switch_from_osm_to_gc_map_in_same_tab) location = url;
                            else window.open(url);
                        } else alert('This map has no geographical coordinates in its link. Just zoom or drag the map, afterwards this will work fine.');
                    });
                }

            } else {waitCount++; if (waitCount <= 50) setTimeout(function(){addGCButton(waitCount);}, 1000);}
        }
        addGCButton(0);
    } catch(e) {gclh_error("mainOSM",e);}
};

//////////////////////////////
// GClh asynchron GC pages
//////////////////////////////
var asynchronGC = function() {
    try {
        // Get header from other GC page.
        $.get('https://www.geocaching.com/adopt', null, function(response){
            var von = response.indexOf('<nav id="gcNavigation">');
            var bis = response.indexOf('<section id="Content">');
            if (von && bis && von != -1 && bis != -1) {
                var headerHTML = response.slice(von, bis - 1);
                headerHTML = headerHTML.replace('<nav ', '<gclh_nav ').replace('</nav>', '</gclh_nav>').replace(/href="\.\./gi, 'href="');
                // Build header and start mainGC.
                function buildUpHeaderAndStart(waitCount, html) {
                    if ($('nav.gc-nav-menu, #GCHeader')[0] && !html == "") {
                        // Part of core CSS of Groundspeak.
                        var css = corecss;
                        // Integrate html for new header.
                        $('nav.gc-nav-menu, #GCHeader').before(html);
                        // Make GC header invisible.
                        $('nav.gc-nav-menu, #GCHeader')[0].style.display = 'none';
                        // User profile menu bend into shape.
                        css += '.gclh_open ul.submenu {visibility: visible; display: block;}';
                        $('#ctl00_uxLoginStatus_divSignedIn button.li-user-toggle')[0].addEventListener('click', function(){
                            $('#ctl00_uxLoginStatus_divSignedIn li.li-user').toggleClass('gclh_open');
                        });
                        // Logout bend into shape.
                        $('.js-sign-out')[0].addEventListener('click', function(){
                            GM_xmlhttpRequest({
                                method: 'POST',
                                url: 'https://www.geocaching.com/account/logout',
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                    'Referer': document.location.pathname
                                },
                                onload: function(response) {
                                    window.location.reload(false);
                                }
                            });
                        });
                        // Special css for searchmap.
                        if (is_page('searchmap')) {
                            css += 'gclh_nav .wrapper {z-index: 1005;} gclh_nav li input {height: unset !important;}';
                        }
                        appendCssStyle(css);
                        // Start mainGC.
                        mainGC();
                    } else {waitCount++; if (waitCount <= 200) setTimeout(function(){buildUpHeaderAndStart(waitCount, html);}, 50);}
                }
                buildUpHeaderAndStart(0, headerHTML);
            }
        });
    } catch(e) {gclh_error("asynchronGC",e);}
};

//////////////////////////////
// GClh Main
//////////////////////////////
var mainGC = function() {

// Hide Facebook.
    if (settings_hide_facebook && (document.location.href.match(/\.com\/(play|account\/register|login|account\/login|seek\/log\.aspx?(.*)|account\/signin)/))) {
        try {
            if ($('.btn.btn-facebook')[0]) $('.btn.btn-facebook')[0].style.display = "none";
            if ($('.divider-flex')[0]) $('.divider-flex')[0].style.display = "none";
            if ($('.divider')[0]) $('.divider')[0].style.display = "none";
            if ($('.disclaimer')[0]) $('.disclaimer')[0].style.display = "none";
            if ($('.login-with-facebook')[0]) $('.login-with-facebook')[0].style.display = "none";
            if ($('.horizontal-rule')[0]) $('.horizontal-rule')[0].style.display = "none";
        } catch(e) {gclh_error("Hide Facebook",e);}
    }

// Wenn nicht angeloggt, dann aussteigen.
   if (!$('.li-user-info')[0]) return;

// Run after redirect.
    if (typeof(unsafeWindow.__doPostBack) == "function") {
        try {
            var splitter = document.location.href.split("#");
            if (splitter && splitter[1] && splitter[1] == "gclhpb" && splitter[2] && splitter[2] != "") {
                var postbackValue = splitter[2];
                // Home coords in GClh übernehmen.
                if (postbackValue == "errhomecoord") {
                    var mess = "To use this link, GClh has to know your home coordinates. \n"
                             + "Do you want to go to the special area and let GClh save \n"
                             + "your home coordinates automatically?\n\n"
                             + "GClh will save it automatically. You have nothing to do at the\n"
                             + "following page \"Home Location\", except, to choose your link again.\n"
                             + "(But, please wait until page \"Home Location\" is loading complete.)";
                    if (window.confirm(mess)) document.location.href = "/account/settings/homelocation";
                    else document.location.href = document.location.href.replace("?#"+splitter[1]+"#"+splitter[2]+"#", "");
                // uid, own trackables in GClh übernehmen.
                } else if (postbackValue == "errowntrackables") {
                    var mess = "To use this link, GClh has to know the identification of \n"
                             + "your trackables. Do you want to go to your dashboard and \n"
                             + "let GClh save the identification (uid) automatically?\n\n"
                             + "GClh will save it automatically. You have nothing to do at the\n"
                             + "following page \"Dashboard\", except, to choose your link again.\n"
                             + "(But, please wait until page \"Dashboard\" is loading complete.)";
                    if (window.confirm(mess)) document.location.href = "/my/default.aspx";
                    else  document.location.href = document.location.href.replace("?#"+splitter[1]+"#"+splitter[2], "");
                // Postbacks.
                } else {
                    if (is_page("publicProfile")) {
                        $('html').css("background-color", "white");
                        $('#divContentSide').css("height", "1000px");
                        $('#ProfileTabs').css("display", "none");
                        $('footer').remove();
                    }
                    document.location.href = "";
                    $('#'+postbackValue)[0].click();
                }
            }
        } catch(e) {gclh_error("Run after redirect",e);}
    }

// After change of a bookmark respectively a bookmark list go automatically from confirmation screen to bookmark list.
   if (((settings_bm_changed_and_go && document.location.href.match(/\.com\/bookmarks\/mark\.aspx\?(guid=|ID=)/)) || (settings_bml_changed_and_go && document.location.href.match(/\.com\/bookmarks\/edit\.aspx/))) && $('#divContentMain')[0] && $('p.Success a[href*="/bookmarks/view.aspx?guid="]')[0]) {
       $('#divContentMain').css("visibility", "hidden");
       document.location.href = $('p.Success a')[0].href;
   }

// Set language to default language.
    if (settings_set_default_langu) {
        try {
            var la = $('.language-list > li > a:contains(' + settings_default_langu + ')');
            if (!la[0]) var la = $('.dropdown-menu > li > a:contains(' + settings_default_langu + ')');
            if (la[0]) {
                if (la[0].className == "selected" || la[0].parentNode.className == "selected");
                else {
                    var event = document.createEvent("MouseEvent");
                    event.initEvent("click", true, true);
                    la[0].dispatchEvent(event);
                }
            }
        } catch(e) {gclh_error("Set language to default language",e);}
    }

// Faster loading trackables without images.
    if (settings_faster_profile_trackables && is_page("publicProfile") && $('#ctl00_ContentBody_ProfilePanel1_lnkCollectibles.Active')[0]) {
        try {
            window.stop();
            $('table.Table tbody tr td a img').each(function() {this.src = "/images/icons/16/watch.png"; this.title = ""; this.style.paddingLeft = "15px";});
        } catch(e) {gclh_error("Faster loading trackables without images",e);}
    }

// Migration: Installationszähler. Migrationsaufgaben erledigen.
    var declaredVersion = getValue("declared_version");
    if (declaredVersion != scriptVersion) {
        try {
            instCount(declaredVersion);
            migrationTasks();
        } catch(e) {gclh_error("Migration",e);}
    }

// Redirect to Map (von Search Liste direkt in Karte springen).
    if (settings_redirect_to_map && document.location.href.match(/\.com\/seek\/nearest\.aspx\?/)) {
        if (!document.location.href.match(/&disable_redirect=/) && !document.location.href.match(/key=/) && !document.location.href.match(/ul=/) && $('#ctl00_ContentBody_LocationPanel1_lnkMapIt')[0]) {
            $('#ctl00_ContentBody_LocationPanel1_lnkMapIt')[0].click();
        }
    }

// F2, F4, F10 keys.
    try {
        // F2 key.
        if (settings_submit_log_button) {
            // Log abschicken (Cache und TB).
            if (document.location.href.match(/\.com\/(seek|track)\/log\.aspx\?(id|wid|guid|ID|wp|LUID|PLogGuid)\=/)) var id = "ctl00_ContentBody_LogBookPanel1_btnSubmitLog";
            // PQ speichern | "Bookmark Pocket Query", aus BM PQ erzeugen | PQ zu Routen.
            if (document.location.href.match(/\.com\/pocket\/(gcquery|bmquery|urquery)\.aspx/)) var id = "ctl00_ContentBody_btnSubmit";
            // "Create a Bookmark" entry, "Edit a Bookmark" entry.
            if (document.location.href.match(/\.com\/bookmarks\/mark\.aspx/)) var id = "ctl00_ContentBody_Bookmark_btnCreate";
            // "Create New Bookmark List", Edit a Bookmark list.
            if (document.location.href.match(/\.com\/bookmarks\/edit\.aspx/)) var id = "ctl00_ContentBody_BookmarkListEditControl1_btnSubmit";
            // Hide cache process speichern.
            if (document.location.href.match(/\.com\/hide\//)) {
                if ($('#btnContinue')[0]) var id = "btnContinue";
                else if ($('#ctl00_ContentBody_btnSaveAndPreview')[0]) var id = "ctl00_ContentBody_btnSaveAndPreview";
                else if ($('#btnSubmit')[0]) var id = "btnSubmit";
                else if ($('#btnNext')[0]) var id = "btnNext";
                else if ($('#ctl00_ContentBody_btnSubmit')[0]) var id = "ctl00_ContentBody_btnSubmit";
                else if ($('#ctl00_ContentBody_Attributes_btnUpdate')[0]) var id = "ctl00_ContentBody_Attributes_btnUpdate";
                else if ($('#ctl00_ContentBody_WaypointEdit_uxSubmitIt')[0]) var id = "ctl00_ContentBody_WaypointEdit_uxSubmitIt";
            }
            // "Save" Personal Cache Note in cache listing.
            if (is_page("cache_listing") && $('.js-pcn-submit')[0]) {
                var id = "gclh_js-pcn-submit";
                $('.js-pcn-submit')[0].id = id;
                document.getElementById(id).innerHTML += " (F2)";
            }
            if (id && document.getElementById(id)) {
                function keydownF2(e) {
                    if (e.keyCode == 113 && noSpecialKey(e) && !check_config_page()) document.getElementById(id).click();
                }
                document.getElementById(id).value += " (F2)";
                window.addEventListener('keydown', keydownF2, true);
            }
        }
        // Aufruf GClh Config per F4 Taste. Nur auf erlaubten Seiten. Nicht im GClh Config.
        if (settings_f4_call_gclh_config && !check_config_page()) {
            function keydownF4(e) {
                if (e.keyCode == 115 && noSpecialKey(e) && !check_config_page()) {
                    if (checkTaskAllowed("GClh Config", false) == true) gclh_showConfig();
                    else document.location.href = defaultConfigLink;
                }
            }
            window.addEventListener('keydown', keydownF4, true);
        }
        // Aufruf GClh Sync per F10 Taste. Nur auf erlaubten Seiten. Nicht im GClh Sync. Nicht im Config Reset Modus.
        if (settings_f10_call_gclh_sync && !check_sync_page()) {
            function keydownF10(e) {
                if (e.keyCode == 121 && noSpecialKey(e) && !check_sync_page() && !global_mod_reset) {
                    if (checkTaskAllowed("GClh Sync", false) == true) gclh_showSync();
                    else document.location.href = defaultSyncLink;
                }
            }
            window.addEventListener('keydown', keydownF10, true);
        }
    } catch(e) {gclh_error("F2, F4, F10 keys",e);}

// Set global data.
    if ($('.li-user-info')[0] && $('.li-user-info')[0].children[1]) var global_me = decode_innerHTML($('.li-user-info')[0].children[1]);

// Change Header layout.
    change_header_layout:
    try {
        if (settings_change_header_layout) {
            if (isMemberInPmoCache()) {
                if ($('#ctl00_siteHeader')[0]) $('#ctl00_siteHeader')[0].remove();
                break change_header_layout;
            }
            // Alle Seiten: Grundeinstellungen:
            // ----------
            var css = "";
            // Font-Size für Menüs, Font-Size für Untermenüs in Pixel.
            var font_size_menu = parseInt(settings_font_size_menu);
            if ((font_size_menu == 0) || (font_size_menu < 0) || (font_size_menu > 16)) font_size_menu = 16;
            var font_size_submenu = parseInt(settings_font_size_submenu);
            if ((font_size_submenu == 0) || (font_size_submenu < 0) || (font_size_submenu > 16)) font_size_submenu = 15;
            // Abstand zwischen Menüs, Abstand zwischen Untermenüs in Pixel.
            var distance_menu = parseInt(settings_distance_menu);
            if ((distance_menu < 0) || (distance_menu > 99)) distance_menu = (50 / 2);
            else distance_menu = (distance_menu / 2);
            if (settings_bookmarks_top_menu == false && settings_menu_show_separator == true) distance_menu = (distance_menu / 2);
            var distance_submenu = parseInt(settings_distance_submenu);
            if ((distance_submenu < 0) || (distance_submenu > 32)) distance_submenu = (8);  // (8/2)
            else distance_submenu = (distance_submenu);  // (.../2)
            // Font-Color in Menüs, Untermenüs.
            var font_color_menu = settings_font_color_menu;
            if (font_color_menu == "") font_color_menu = "93B516";
            var font_color_submenu = settings_font_color_submenu;
            if (font_color_submenu == "") font_color_submenu = "93B516";
            // Menüweite berechnen.
            var new_width = 950;
            var new_width_menu = 950;
            var new_width_menu_cut_old = 0;
            var new_padding_right = 0;
            if (getValue("settings_new_width") > 0) new_width = parseInt(getValue("settings_new_width"));
            new_padding_right = 261 - 14;
            if (settings_show_smaller_gc_link) {
                new_width_menu = new_width - 261 + 20 - 28;
                new_width_menu_cut_old = 28;
            } else {
                new_width_menu = new_width - 261 + 20 - 190;
                new_width_menu_cut_old = 190;
            }
            // Member Upgrade Button entfernen.
            $('.li-upgrade').remove();
            if ($('.li-membership')[0]) $('.li-membership')[0].remove();
            // Im neuen Dashboard Upgrade Erinnerung entfernen.
            $('.sidebar-upsell').remove();
            // Icons aus Play Menü entfernen.
            $('.charcoal').remove();
            $('.li-attention').removeClass('li-attention').addClass('li-attention_gclh');
            css +=
                // Schriftfarbe Menü.
                ".#m li a, .#m li a:link, .#m li a:visited, .#m li {color: #" + font_color_menu + " !important;}" +
                ".#m li a:hover, .#m li a:focus {color: #FFFFFF !important; outline: unset !important;}" +
                // Schriftfarbe Search Field.
                "#navi_search {color: #4a4a4a};" +
                // Menü nicht flex.
                ".#m {display: unset;}" +
                // Submenü im Vordergrund.
                ".#m .#sm {z-index: 1001;}" +
                // Schriftfarbe Untermenü.
                ".#m .#sm li a, .#m .#sm li a:link, .#m .#sm li a:visited, .#m .#sm li {color: #" + font_color_submenu + " !important;}" +
                // Schriftgröße Menü.
                ".#m {font-size: 16px !important;}" +
                ".#m li, .#m li a, .#m li input {font-size: " + font_size_menu + "px !important;}" +
                // Abstände Menü.
                "ul.#m > li {margin-left: " + distance_menu + "px !important; margin-right: " + distance_menu + "px !important;} ul.#m li a {padding: .25em .25em .25em 0 !important;}" +
                // Schriftgröße Untermenü.
                ".#m ul.#sm, .#m ul.#sm li {font-size: 16px !important;}" +
                ".#m ul.#sm li a {font-size: " + font_size_submenu + "px !important;}" +
                // Abstände Untermenü.
                ".#m ul.#sm li a {margin: " + (distance_submenu / 2) + "px 1em !important; padding: 0 0.5em !important;} .#m .#sm a {line-height: unset;} .#m a {overflow: initial}" +
                // Menühöhe.
                ".#m {height: 35px !important;}" +
                // Verschieben Submenüs unterbinden.
                ".#m .#sm {margin-left: 0 !important}";
            // Vertikales Menü ausrichten.
            if (settings_bookmarks_top_menu) {
                // Menüzeilenhöhe, Menü nicht flex.
                css += "ul.#m {line-height: 16px; display: block;}";
                // Zwischen Menüname und Submenü keine Lücke lassen, sonst klappts nicht mit einfachem Aufklappen.
                css += ".#m li a, .#m li a:link, .#m li a:visited {margin-bottom: 10px;} .#m ul.#sm {margin-top: -6px;}";
            // Horizontales Menü ausrichten.
            } else {
                // Menüzeilenhöhe.
                css += "ul.#m {line-height: 16px !important;}";
                // Zeilenabstand in Abhängigkeit von Anzahl Zeilen.
                if      (settings_menu_number_of_lines == 2) css += "ul.#m li a {padding-top: 4px !important; padding-bottom: 4px !important;}";
                else if (settings_menu_number_of_lines == 3) css += "ul.#m li a {padding-top: 1px !important; padding-bottom: 1px !important;}";
            }
            // Message Center Icon entfernen.
            if (settings_remove_message_in_header) $('.messagecenterheaderwidget').remove();
            // Geocaching Logo ersetzen, verschieben oder entfernen.
            if ($('.logo')[0]) {
                var side = $('.logo')[0];
                changeGcLogo(side);
            }
            css +=
                "#l {flex: unset; overflow: unset; margin-left: -32px} #newgclogo {width: 30px !important;}" +
                ".#m {width: " + new_width_menu + "px !important; margin-left: 6px !important;}" +
                "nav .wrapper, gclh_nav .wrapper {min-width: " + (new_width + 40) + "px !important; max-width: unset;}";
            // Bereich links ausrichten in Abhängigkeit davon, ob Logo geändert wird und ob GC Tour im Einsatz ist.
            if      (!settings_show_smaller_gc_link && !settings_gc_tour_is_working) css += "#l {margin-top:   0px; fill: #ffffff;}";
            else if (!settings_show_smaller_gc_link && settings_gc_tour_is_working)  css += "#l {margin-top: -47px; fill: #ffffff;}";
            else if (settings_show_smaller_gc_link  && !settings_gc_tour_is_working) css += "#l {margin-top:   6px; width: 30px;}";
            else if (settings_show_smaller_gc_link  && settings_gc_tour_is_working)  css += "#l {margin-top: -41px; width: 30px;}";

            // Account Settings, Message Center, Cache suchen, Cache verstecken, Geotours, Karten, account/dashboard und track:
            // ----------
            if (is_page("settings") || is_page("messagecenter") || is_page("find_cache") || is_page("hide_cache") || is_page("geotours") || is_page("map") || is_page("dashboard-section") || is_page("track")) {
                css += "nav .wrapper {padding-right: " + new_padding_right + "px !important; width: unset;}";
                // Fehler bei Plazierung Videos verursacht durch neues Logo korrigieren.
                if (is_page("hide_cache")) css += ".video iframe {width: 90%;}";
                // Vertikales Menü ausrichten.
                if (settings_bookmarks_top_menu) {
                    css += ".#m ul.#sm {margin-top: 0px; margin-left: 32px !important;} .#m .submenu::after {left: 4px; width: 26px;}";
                    // Menü, Searchfield ausrichten in Abhängigkeit von Schriftgröße. Menü nicht flex.
                    if (settings_menu_float_right) {
                        css += "ul.#m > li {margin-top: " + (3 + (16 - font_size_menu) / 2) + "px;}";
                    } else {
                        if (is_page("map")) css += "ul.#m > li {margin-top: " + (-2 + (16 - font_size_menu) / 2) + "px;}";
                        else css += "ul.#m > li {margin-top: " + (3 + (16 - font_size_menu) / 2) + "px;}";
                    }
                    // Menü in Karte ausrichten.
                    if (is_page("map") && !settings_menu_float_right) css += ".#m {height: unset !important;}";
                    if (is_page("map") && settings_menu_float_right) css += "#navi_search {margin: 0 !important;}";
                }
                // Bereich rechts ausrichten.
                css += ".profile-panel {margin-right: -15.25em}";

            // Altes Seiten Design und restliche Seiten:
            // ----------
            } else {
                if (settings_fixed_header_layout) {
                    css += "nav .wrapper, gclh_nav .wrapper {width: " + new_width + "px !important; padding-left: 50px; padding-right: 30px; min-width: unset}";
                    if (settings_remove_logo && settings_show_smaller_gc_link) css += ".#m {margin-left: -28px !important;}";
                }
                // Vertikales Menü  ausrichten.
                if (settings_bookmarks_top_menu) {
                    css += ".#m ul.#sm {margin-top: 15px; margin-left: 32px !important;} .#m .submenu::after {left: 4px; width: 26px;}";
                    // Zwischen Menüname und Submenü keine Lücke lassen, sonst klappt das nicht mit dem einfachen Aufklappen.
                    css += ".#m > li .dropdown {padding-bottom: 14px !important;}";
                    // Menü, Searchfield ausrichten in Abhängigkeit von Schriftgröße. Menü nicht flex.
                    if (settings_menu_float_right) {
                        css += "ul.#m > li {margin-top: " + (7 + (16 - font_size_menu) / 2) + "px;}";
                    } else {
                        css += "ul.#m > li {margin-top: " + (5 + (16 - font_size_menu) / 2) + "px;}";
                    }
                // Horizontales Menü ausrichten in Abhängigkeit von Anzahl Zeilen.
                } else {
                    if      (settings_menu_number_of_lines == 1) css += "ul.#m {top:   4px !important;}";
                    else if (settings_menu_number_of_lines == 2) css += "ul.#m {top:  -8px !important;}";
                    else if (settings_menu_number_of_lines == 3) css += "ul.#m {top: -13px !important;}";
                }
            }
            // Alle Seiten: Platzhalter umsetzen:
            // ----------
            css = css.replace(/#m/gi, "menu").replace(/#sm/gi, "submenu").replace(/#l/gi, "nav .logo, gclh_nav .logo");
            appendCssStyle(css);
        }
    } catch(e) {gclh_error("Change header layout",e);}
    // GC Logo.
    function changeGcLogo(side) {
        if (settings_show_smaller_gc_link && side && side.children[0]) {
            side.children[0].remove();
            if (!settings_remove_logo) {
                var gc_link = document.createElement("a");
                var gc_img = document.createElement("img");
                gc_img.setAttribute("style", "clip: unset; width: 35px; margin-top: -3px;");
                gc_img.setAttribute("title", "Geocaching");
                gc_img.setAttribute("id", "newgclogo");
                gc_img.setAttribute("src", global_gc_icon);
                gc_link.appendChild(gc_img);
                gc_link.setAttribute("href", "/");
                side.appendChild(gc_link);
            }
        }
    }

// New Width. (Menüweite wird bei Change Header Layout gesetzt.)
    new_width:
    try {
        // Keine Anpassungen.
        if (is_page('lists') || is_page('searchmap') || is_page("messagecenter") || is_page("settings") || is_page("hide_cache") || is_page("find_cache") || is_page("geotours") || is_page("map") || is_page("dashboard-section") || is_page("track")) break new_width;

        if (getValue("settings_new_width") > 0) {
            var new_width = parseInt(getValue("settings_new_width"));
            var css = "";
            // Header- und Fußbereich:
            css += "header, nav, footer {min-width: " + (new_width + 40) + "px !important;}";
            css += "header .container, nav .container {max-width: unset;}";
            // Keine weiteren Anpassungen.
            if (document.location.href.match(/\.com\/pocket\/gcquery\.aspx/) ||  // Pocket Query: Einstellungen zur Selektion
                 document.location.href.match(/\.com\/pocket\/bmquery\.aspx/));  // Pocket Query aus Bockmarkliste: Einstellungen zur Selektion
            else {
                css += "#Content .container, #Content .span-24, .span-24 {width: " + new_width + "px;}";
                css += ".CacheStarLabels.span-6 {width: " + ((new_width - 300 - 190 - 10 - 10) / 2) + "px !important;}";
                css += ".span-6.right {width: " + ((new_width - 300 - 190 - 10 - 10) / 2) + "px !important;}";
                css += ".span-8 {width: " + ((new_width - 330 - 10) / 2) + "px !important;}";
                css += ".span-10 {width: " + ((new_width - 170) / 2) + "px !important;}";
                css += ".span-15 {width: " + (new_width - 360) + "px !important;}";
                css += ".span-16 {width: " + (new_width - 320 - 10) + "px !important;}";
                css += ".span-17 {width: " + (new_width - 300) + "px !important;}";
                css += ".span-19 {width: " + (new_width - 200) + "px !important;}";
                css += ".span-20 {width: " + (new_width - 160) + "px;}";
                css += ".LogDisplayRight {width: " + (new_width - 180) + "px !important;}";
                css += "#log_tabs .LogDisplayRight {width: " + (new_width - 355) + "px !important;}";
                css += "#uxBookmarkListName {width: " + (new_width - 470 - 5) + "px !important;}";
                css += "table.TrackableItemLogTable div {width: " + (new_width - 160) + "px !important; max-width: unset;}";
                css += ".UserSuppliedContent {max-width: unset;}";
                // Besonderheiten:
                if (!is_page("cache_listing")) css += ".UserSuppliedContent {width: " + (new_width - 200) + "px;}";
                if (is_page("publicProfile")) css += ".container .profile-panel {width: " + (new_width - 160) + "px;}";
                if (is_page("cache_listing")) css += ".span-9 {width: " + (new_width - 300 - 270 - 13 - 13 - 10 - 6) + "px !important;}";
                else if (document.location.href.match(/\.com\/my\/statistics\.aspx/) || (is_page("publicProfile") && $('#ctl00_ContentBody_ProfilePanel1_lnkStatistics.Active')[0])) {
                    css += ".span-9 {width: " + ((new_width - 280) / 2) + "px !important; margin-right: 30px;} .last {margin-right: 0px;}";
                    css += ".StatsTable {width: " + (new_width - 250) + "px !important;}";
                } else if (is_page("publicProfile")) {
                    if ($('#ctl00_ContentBody_ProfilePanel1_lnkCollectibles.Active')[0]) {
                        css += ".span-9 {width: " + ((new_width - 220) / 2) + "px !important;} .prepend-1 {padding-left: 10px;}";
                    } else {
                        css += ".span-9 {width: " + ((new_width - 250) / 2) + "px !important;}";
                        css += ".StatsTable {width: " + (new_width - 250 - 30) + "px !important;}";
                    }
                }
            }
            appendCssStyle(css);
        }
    } catch(e) {gclh_error("New width",e);}

// Remove GC Menüs.
    try {
        var m = $('ul.(Menu|menu) li a.dropdown');
        for (var i = 0; i < m.length; i++) {
            if ((m[i].href.match(/\/play\/search/) && getValue('remove_navi_play')) ||
                (m[i].href.match(/\/forums\/$/) && getValue('remove_navi_community')) ||
                (m[i].href.match(/shop\.geocaching\.com/) && getValue('remove_navi_shop'))) {
                m[i].parentNode.remove();
            }
            if (m[i].href.match(/\/play\/search/) || m[i].href.match(/\/forums\/$/) || m[i].href.match(/shop\.geocaching\.com/)) {
                m[i].href = '#';
            }
        }
    } catch(e) {gclh_error("Remove GC Menüs",e);}

// Linklist on top.
    try {
        if (settings_bookmarks_on_top) {
            // Auch ohne Change Header Layout zwischen Menüname und Submenü keine Lücke lassen, sonst klappts nicht mit einfachem Aufklappen.
            if (!settings_change_header_layout) {
                if (is_page("map")) {
                    appendCssStyle(".menu > li, .Menu > li {height: 100%; padding-top: 2.0em;} .submenu, .SubMenu {margin-top: 1.9em;}");
                } else if (is_page("find_cache") || is_page("hide_cache") || is_page("geotours") || is_page("dashboard-section") || is_page("track")) {
                    appendCssStyle(".menu > li, .Menu > li {height: 100%; padding-top: 2.1em;} .submenu, .SubMenu {margin-top: 2.0em;}");
                } else {
                    appendCssStyle(".menu > li, .Menu > li {height: 100%; padding-top: 2.0em;} .submenu, .SubMenu {margin-top: 2.0em;}");
                }
            }
        }
        if (settings_bookmarks_on_top && $('.Menu, .menu').length > 0) {
            var nav_list = $('.Menu, .menu')[0];
            var menu = document.createElement("li");
            var headline = document.createElement("a");
            if (settings_bookmarks_top_menu || settings_change_header_layout == false) {  // Navi vertikal
                headline.setAttribute("href", "#");
                headline.setAttribute("class", "Dropdown dropdown");
                headline.setAttribute("accesskey", "7");
                headline.innerHTML = "Linklist";
                menu.appendChild(headline);
                var submenu = document.createElement("ul");
                $(submenu).addClass("SubMenu").addClass("submenu");
                menu.appendChild(submenu);
                for (var i = 0; i < settings_bookmarks_list.length; i++) {
                    var x = settings_bookmarks_list[i];
                    if (typeof(x) == "undefined" || x == "" || typeof(x) == "object") continue;
                    var sublink = document.createElement("li");
                    var hyperlink = document.createElement("a");
                    for (attr in bookmarks[x]) {
                        if (attr != "custom" && attr != "title") hyperlink.setAttribute(attr, bookmarks[x][attr]);
                    }
                    hyperlink.appendChild(document.createTextNode(bookmarks[x]['title']));
                    sublink.appendChild(hyperlink);
                    submenu.appendChild(sublink);
                }
                nav_list.appendChild(menu);
            } else {  // Navi horizontal
                for (var i = 0; i < settings_bookmarks_list.length; i++) {
                    var x = settings_bookmarks_list[i];
                    if (typeof(x) == "undefined" || x == "" || typeof(x) == "object") continue;
                    var sublink = document.createElement("li");
                    var hyperlink = document.createElement("a");
                    for (attr in bookmarks[x]) {
                        if (attr != "custom" && attr != "title") hyperlink.setAttribute(attr, bookmarks[x][attr]);
                    }
                    hyperlink.appendChild(document.createTextNode(bookmarks[x]['title']));
                    sublink.appendChild(hyperlink);
                    nav_list.appendChild(sublink);
                }
            }
            // Search field.
            if (settings_bookmarks_search) {
                var code = "function gclh_search_logs(){";
                code += "  var search = document.getElementById('navi_search').value;";
                code += "  if(search.match(/^GC[A-Z0-9]{1,10}\\b/i) || search.match(/^TB[A-Z0-9]{1,10}\\b/i) || search.match(/^GT[A-Z0-9]{1,10}\\b/i)) document.location.href = 'http://coord.info/'+search;";
                code += "  else if(search.match(/^[A-Z0-9]{6}\\b$/i)) document.location.href = '/track/details.aspx?tracker='+search;";
                code += "  else document.location.href = '/seek/nearest.aspx?navi_search='+search;";
                code += "}";
                injectPageScript(code, "body");
                var searchfield = "<li><input onKeyDown='if(event.keyCode==13 && event.ctrlKey == false && event.altKey == false && event.shiftKey == false) {gclh_search_logs(); return false;}' type='text' size='6' name='navi_search' id='navi_search' style='padding: 1px; font-weight: bold; font-family: sans-serif; border: 2px solid #778555; border-radius: 7px 7px 7px 7px; background-color:#d8cd9d' value='" + settings_bookmarks_search_default + "'></li>";
                $(".Menu, .menu").append(searchfield);
            }
            // Hover für alle Dropdowns aufbauen.
            buildHover();

            if (settings_menu_show_separator) {
                if (settings_bookmarks_top_menu || settings_change_header_layout == false);  // Navi vertikal
                else {  // Navi horizontal
                    var menuChilds = $('ul.Menu, ul.menu')[0].children;
                    for (var i = 1; i < menuChilds.length; i += 2) {
                        var separator = document.createElement("li");
                        separator.appendChild(document.createTextNode("|"));
                        menuChilds[i].parentNode.insertBefore(separator, menuChilds[i]);
                    }
                }
            }
            // Vertikale Menüs rechts ausrichten.
            if (settings_bookmarks_top_menu && settings_menu_float_right && settings_change_header_layout) {
                if ($('ul.Menu, ul.menu')[0]) {
                    var menu = $('ul.Menu, ul.menu')[0];
                    var menuChilds = $('ul.Menu, ul.menu')[0].children;
                    for (var i = 0; i < menuChilds.length; i++) {
                        var child = menu.removeChild(menu.children[menuChilds.length-1-i]);
                        child.setAttribute("style", "float: right;");
                        menu.appendChild(child);
                    }
                }
            }
        }
    } catch(e) {gclh_error("Linklist on top",e);}
    // Hover aufbauen. Muss nach Menüaufbau erfolgen.
    function buildHover() {
        $('ul.Menu, ul.menu').children().hover(function() {
                $(this).addClass('hover');
                $(this).addClass('open');
                $('ul:first', this).css('visibility', 'visible');
            },
            function() {
                $(this).removeClass('hover');
                $(this).removeClass('open');
                $('ul:first', this).css('visibility', 'hidden');
            }
        );
    }

// Show draft indicator in header
    if(settings_show_draft_indicator){
        try{
            $.get('https://www.geocaching.com/account/dashboard', null, function(text){

                // Look for drafts in old layout
                draft_list = $(text).find('#uxDraftLogs span');
                if(draft_list != null){
                    drafts = draft_list[0];
                }else{
                    drafts = false;
                }

                if(!drafts){
                    // if not found, Look for drafts in new layout
                    draft_list = $(text).find("nav a[href='/my/fieldnotes.aspx']");
                    if(draft_list != null){
                        drafts = draft_list[0];
                    }else{
                        drafts = false;
                    }
                }

                if(drafts){
                    draft_count = parseInt(drafts.innerHTML.match(/\d+/));
                    if(Number.isInteger(draft_count) && draft_count > 0){
                        // we found drafts, so show them in the header
                        appendCssStyle('.draft-indicator{ background-color: #e0b70a;font-weight:bold;position: absolute;padding: 0 5px;border-radius: 15px;top: -7px;left: -7px; } .draft-indicator a{width: auto !important; font-size: 14px;min-width: 10px; display: block; text-align: center;}');
                        $('.li-user-info .user-avatar').prepend('<span class="draft-indicator"><a href="/my/fieldnotes.aspx" title="Go to Drafts">' + draft_count + '</a></span>');
                    }else{
                        // No drafts found
                    }
                }else{
                    // Non of the content was found
                    // This should not happen, only if GC changes something
                }
            });
        }catch(e) {gclh_error("Show draft indicator in header",e);}
    }

// Disabled and archived ...
    if (is_page("cache_listing")) {
        try {
            if ($('#ctl00_ContentBody_uxGalleryImagesLink')[0]) $('#ctl00_ContentBody_uxGalleryImagesLink')[0].innerHTML = $('#ctl00_ContentBody_uxGalleryImagesLink')[0].innerHTML.replace("View the ", "");
            if ($('#ctl00_ContentBody_archivedMessage')[0] && $('#ctl00_ContentBody_CacheName')[0]) $('#ctl00_ContentBody_CacheName')[0].style.color = '#8C0B0B';
            // (If the cache is locked for new logs, the ctl00_ContentBody_archivedMessage respectively the ctl00_ContentBody_disabledMessage info is not available.)
            if (settings_strike_archived && $('#ctl00_ContentBody_CacheName')[0] && ($('#ctl00_ContentBody_archivedMessage')[0] || $('#ctl00_ContentBody_disabledMessage')[0])) {
                $('#ctl00_ContentBody_CacheName')[0].style.textDecoration = 'line-through';
            }
            if ($('.more-cache-logs-link')[0] && $('.more-cache-logs-link')[0].href) $('.more-cache-logs-link')[0].href = "#logs_section";
            if (settings_log_status_icon_visible && $('#activityBadge use')[0]) {
                $('#activityBadge use')[0].setAttribute('xlink:href', $('#activityBadge use')[0].getAttribute('xlink:href').replace('-disabled', ''));
            }
            if (settings_cache_type_icon_visible && $('#uxCacheImage use')[0]) {
                $('#uxCacheImage use')[0].setAttribute('xlink:href', $('#uxCacheImage use')[0].getAttribute('xlink:href').replace('-disabled', ''));
            }
        } catch(e) {gclh_error("Disabled and archived",e);}
    }

// Improve calendar link in events. (Im Google Link den Cache Link von &location nach &details verschieben.)
    if (is_page("cache_listing") && document.getElementById("calLinks")) {
        try {
            function impCalLink(waitCount) {
                if ($('#calLinks').find('a[title*="Google"]')[0]) {
                    var calL = $('#calLinks').find('a[title*="Google"]')[0];
                    if (calL && calL.href) calL.href = calL.href.replace(/&det(.*)&loc/, "&loc").replace(/%20\(http/, "&details=http").replace(/\)&spr/, "&spr");
                } else {
                    waitCount++;
                    if (waitCount <= 20) setTimeout(function(){impCalLink(waitCount);}, 100);
                }
            }
            impCalLink(0);
        } catch(e) {gclh_error("Improve calendar link",e);}
    }

// Show eventday beside date.
    if (settings_show_eventday && is_page("cache_listing") && $('#cacheDetails svg.cache-icon use')[0] && $('#cacheDetails svg.cache-icon use')[0].href.baseVal.match(/\/cache-types.svg\#icon-(6$|6-|453$|453-|13$|13-|7005$|7005-)/)) {  // Event, MegaEvent, Cito, GigaEvent
        try {
            var match = $('meta[name="og:description"]')[0].content.match(/([0-9]{2})\/([0-9]{2})\/([0-9]{4})/);
            if(match == null){
                match = $('meta[name="description"]')[1].content.match(/([0-9]{2})\/([0-9]{2})\/([0-9]{4})/);
            }
            if(match != null){
                var date = new Date(match[3], match[1]-1, match[2]);
                if (date != "Invalid Date") {
                    var weekday = new Array(7);
                    weekday[0] = "Sunday"; weekday[1] = "Monday"; weekday[2] = "Tuesday"; weekday[3] = "Wednesday"; weekday[4] = "Thursday"; weekday[5] = "Friday"; weekday[6] = "Saturday";
                    var name = " (" + weekday[date.getDay()] + ") ";
                    var elem = document.createTextNode(name);
                    var side = $('#ctl00_ContentBody_mcd2')[0];
                    side.insertBefore(elem, side.childNodes[1]);
                }
            }
        } catch(e) {gclh_error("Show eventday beside date",e);}
    }

// Show real owner.
    if (is_page("cache_listing") && $('#ctl00_ContentBody_mcd1')) {
        try {
            var real_owner = get_real_owner();
            var link_owner = $('#ctl00_ContentBody_mcd1 a[href*="/profile/?guid="]')[0];
            if (link_owner && real_owner) {
                var pseudo = link_owner.innerText;
                link_owner.innerHTML = (settings_show_real_owner ? real_owner : pseudo);
                link_owner.title = (settings_show_real_owner ? pseudo : real_owner);
            }
        } catch(e) {gclh_error("Show real owner",e);}
    }

// Hide disclaimer on cache listing and print page.
    if (settings_hide_disclaimer && (is_page("cache_listing") || document.location.href.match(/\.com\/seek\/cdpf\.aspx/))) {
        try {
            var d = ($('.Note.Disclaimer')[0] || $('.DisclaimerWidget')[0] || $('.TermsWidget.no-print')[0]);
            if (d) d.remove();
        } catch(e) {gclh_error("Hide disclaimer",e);}
    }

// Highlight related web page link.
    if (is_page("cache_listing") && $('#ctl00_ContentBody_uxCacheUrl')[0]) {
        try {
            var lnk = $('#ctl00_ContentBody_uxCacheUrl')[0];
            var html = "<fieldset class=\"DisclaimerWidget\"><legend class=\"warning\">Please note</legend><p class=\"NoBottomSpacing\">"+lnk.parentNode.innerHTML+"</p></fieldset>";
            lnk.parentNode.innerHTML = html;
        } catch(e) {gclh_error("Highlight related web page link",e);}
    }

// Show the latest logs symbols.
    if (is_page("cache_listing") && settings_show_latest_logs_symbols && settings_load_logs_with_gclh) {
        try {
            function showLatestLogsSymbols(waitCount) {
                var gcLogs = false;
                if (waitCount == 0) {
                    var logs = $('#cache_logs_table tbody tr.log-row').clone();  // GC Logs
                    if (logs.length >= settings_show_latest_logs_symbols_count) gcLogs = true;
                }
                if (!gcLogs) var logs = $('#cache_logs_table2 tbody tr.log-row');  // GClh Logs
                if (logs.length > 0) {
                    var lateLogs = new Array();
                    for (var i = 0; i < logs.length; i++) {
                        if (settings_show_latest_logs_symbols_count == i) break;
                        var lateLog = new Object();
                        if(gcLogs){
                            // Using initial GCLogs, they look different
                            lateLog['user'] = $(logs[i]).find('a[href*="/profile/?guid="]').text();
                            lateLog['id'] = $(logs[i]).attr('class').match(/l-\d+/)[0].substr(2);
                        }else{
                            lateLog['user'] = $(logs[i]).find('.logOwnerProfileName a[href*="/profile/?guid="]').text();
                            lateLog['id'] = $(logs[i]).find('.logOwnerProfileName a[href*="/profile/?guid="]').attr('id');
                        }
                        lateLog['src'] = $(logs[i]).find('.LogType img[src*="/images/logtypes/"]').attr('src');
                        lateLog['type'] = $(logs[i]).find('.LogType img[src*="/images/logtypes/"]').attr('title');
                        lateLog['date'] = $(logs[i]).find('.LogDate').text();
                        if (gcLogs) lateLog['log'] = $(logs[i]).find('.LogText').children().clone();
                        else lateLog['log'] = $(logs[i]).find('.LogContent').children().clone();
                        lateLogs[i] = lateLog;
                    }
                    if (lateLogs.length > 0 && $('#ctl00_ContentBody_mcd1')[0].parentNode) {
                        var side = $('#ctl00_ContentBody_mcd1')[0].parentNode;
                        side.style.display = "initial";
                        var div = document.createElement("div");
                        var divTitle = "";
                        div.id = "gclh_latest_logs";
                        div.setAttribute("style", "float: right; padding-right: 0; padding-top: 2px;");
                        div.appendChild(document.createTextNode("Latest logs:"));
                        for (var i = 0; i < lateLogs.length; i++) {
                            var a = document.createElement("a");
                            a.className = "gclh_latest_log";
                            if (gcLogs) {
                                a.href = "#";
                                a.style.cursor = "unset";
                            } else a.href = "#" + lateLogs[i]['id'];
                            var img = document.createElement("img");
                            img.src = lateLogs[i]['src'];
                            img.setAttribute("style", "padding-left: 2px; vertical-align: bottom; ");
                            img.title = img.alt = "";
                            var log_text = document.createElement("span");
                            log_text.title = "";
                            log_text.innerHTML = "<img src='" + lateLogs[i]['src'] + "'> <b>" + lateLogs[i]['user'] + " - " + lateLogs[i]['date'] + "</b><br>";
                            a.appendChild(img);
                            for (var j = 0; j < lateLogs[i]['log'].length; j++) {
                                if (j == 0 && !gcLogs) continue;
                                log_text.appendChild(lateLogs[i]['log'][j]);
                            }
                            a.appendChild(log_text);
                            div.appendChild(a);
                            divTitle += (divTitle == "" ? "" : "\n" ) + lateLogs[i]['type'] + " - " + lateLogs[i]['date'] + " - " + lateLogs[i]['user'];
                        }
                        div.title = divTitle;
                        side.appendChild(div);
                        if (getValue("settings_new_width") > 0) var new_width = parseInt(getValue("settings_new_width")) - 310 - 180;
                        else var new_width = 950 - 310 - 180;
                        var css = "a.gclh_latest_log:hover {position: relative;}"
                                + "a.gclh_latest_log span {display: none; position: absolute; left: -" + new_width + "px; width: " + new_width + "px; padding: 5px; text-decoration:none; text-align:left; vertical-align:top; color: #000000;}"
                                + "a.gclh_latest_log:hover span {font-size: 13px; display: block; top: 16px; border: 1px solid #8c9e65; background-color:#dfe1d2; z-index:10000;}";
                        appendCssStyle(css);

                        // In den GC Logs ist die Id für die Logs immer die Gleiche ..., ja doch ..., is klar ne ..., GS halt.
                        // Deshalb müssen die Ids der Latest logs nachträglich in den GClh Logs ermittelt werden.
                        function corrLatestLogsIds(waitCount) {
                            if ($('#cache_logs_table2 tbody tr.log-row').length > 0) {
                                var logsIds = $('#cache_logs_table2 tbody tr.log-row .logOwnerProfileName a');
                                var latestLogsIds = $('#gclh_latest_logs .gclh_latest_log');
                                for (var i = 0; i < 10; i++) {
                                    if (!logsIds[i] || !latestLogsIds[i]) break;
                                    latestLogsIds[i].href = '#'+logsIds[i].id;
                                    latestLogsIds[i].style.cursor = "pointer";
                                }
                            } else {waitCount++; if (waitCount <= 250) setTimeout(function(){corrLatestLogsIds(waitCount);}, 200);}
                        }
                        if (gcLogs) corrLatestLogsIds(0);
                    }
                } else {waitCount++; if (waitCount <= 250) setTimeout(function(){showLatestLogsSymbols(waitCount);}, 200);}
            }
            showLatestLogsSymbols(0);
        } catch(e) {gclh_error("Show the latest logs symbols",e);}
    }

// Show log totals symbols at the top of cache listing.
    if (is_page("cache_listing") && settings_show_log_totals && $('.LogTotals')[0] && $('#ctl00_ContentBody_size')[0]) {
        try {
            var div = document.createElement('div');
            div.className = "gclh_LogTotals Clear";
            div.innerHTML = $('.LogTotals')[0].innerHTML.replace(/alt="(.*?)"/g, "alt=\" \"").replace(/(&nbsp;){5}/g, "&nbsp;&nbsp;");
            $('#ctl00_ContentBody_size')[0].parentNode.insertBefore(div, $('#ctl00_ContentBody_size')[0].nextSibling.nextSibling.nextSibling);
            appendCssStyle('.gclh_LogTotals {float: right;} .gclh_LogTotals img {vertical-align: bottom;}');
        } catch(e) {gclh_error("Show log totals symbols at the top",e);}
    }

// Copy Coords to clipboard.
    if (is_page("cache_listing") && $('#uxLatLonLink')[0]) {
        try {
            var cc2c = false;
            var span2 = document.createElement('span');
            span2.innerHTML = '<a href="javascript:void(0);" id="gclh_cc2c"><img src="'+global_copy_icon+'" title="Copy Coordinates to Clipboard" style="vertical-align: text-top;"></a> ';
            $('#uxLatLonLink')[0].parentNode.insertBefore(span2, $('#uxLatLonLink')[0] );
            $('#gclh_cc2c')[0].addEventListener('click', function() {
                // Tastenkombination Strg+c ausführen für eigene Verarbeitung.
                cc2c = true;
                document.execCommand('copy');
            }, false);
            document.addEventListener('copy', function(e){
                // Normale Tastenkombination Strg+c für markierter Bereich hier nicht verarbeiten. Nur eigene Tastenkombination Strg+c hier verarbeiten.
                if (!cc2c) return;
                // Gegebenenfalls markierter Bereich wird hier nicht beachtet.
                e.preventDefault();
                // angezeigte Koordinaten werden hier verarbeitet.
                e.clipboardData.setData('text/plain', $('#uxLatLon')[0].innerHTML);
                $('#gclh_cc2c')[0].style.opacity = '0.3';
                setTimeout(function() { $('#gclh_cc2c')[0].style.opacity = 'unset'; }, 200);
                cc2c = false;
            });
        } catch(e) {gclh_error("Copy Coordinates to Clipboard:",e);}
    }

// Copy GC Code to clipboard.
    if (is_page('cache_listing') && $('.CoordInfoLink')[0] && $('#ctl00_ContentBody_CoordInfoLinkControl1_uxCoordInfoCode')[0]) {
        try {
            var ctoc = false;
            var span = document.createElement('span');
            span.innerHTML = '<a href="javascript:void(0);" id="gclh_ctoc"><img src="'+global_copy_icon+'" title="Copy GC Code to clipboard" style="vertical-align: text-top;"></a>';
            $('.CoordInfoLink')[0].parentNode.insertBefore(span, $('.CoordInfoLink')[0]);
            $('#gclh_ctoc')[0].addEventListener('click', function() {
                // Tastenkombination Strg+c ausführen für eigene Verarbeitung.
                ctoc = true;
                document.execCommand('copy');
            }, false);
            document.addEventListener('copy', function(e){
                // Normale Tastenkombination Strg+c für markierter Bereich hier nicht verarbeiten. Nur eigene Tastenkombination Strg+c hier verarbeiten.
                if (!ctoc) return;
                // Gegebenenfalls markierter Bereich wird hier nicht beachtet.
                e.preventDefault();
                // GC Code wird hier verarbeitet.
                e.clipboardData.setData('text/plain', $('#ctl00_ContentBody_CoordInfoLinkControl1_uxCoordInfoCode')[0].innerHTML);
                $('#gclh_ctoc')[0].style.opacity = '0.3';
                setTimeout(function() { $('#gclh_ctoc')[0].style.opacity = 'unset'; }, 200);
                ctoc = false;
            });
        } catch(e) {gclh_error("Copy GC Code to clipboard",e);}
    }

// Show favorite percentage.
    if (settings_show_fav_percentage && is_page("cache_listing") && $('#uxFavContainerLink')[0]) {
        try {
            function gclh_load_score(waitCount) {
                unsafeWindow.showFavoriteScore();
                if ($('.favorite-container')[0] && $('.favorite-score')[0].innerHTML.match("%") && $('.favorite-dropdown')[0]) {
                    var fav = $('.favorite-container')[0];
                    var score = $('.favorite-score')[0].innerHTML.match(/(.*%)\.*/);
                    if (score && score[1]) {
                        // Eigener Favoritenpunkt. Class hideMe -> kein Favoritenpunkt. Keine class hideMe -> Favoritenpunkt.
                        var myfav = $('#pnlFavoriteCache')[0];
                        var myfavHTML = "";
                        if (myfav) {
                            if (myfav.className.match("hideMe")) myfavHTML = '&nbsp;<img src="/images/icons/reg_user.gif" />';
                            else myfavHTML = '&nbsp;<img src="/images/icons/prem_user.gif" />';
                        }
                        fav.getElementsByTagName('span')[0].nextSibling.remove();
                        fav.innerHTML += score[1] + myfavHTML;
                        var dd = $('.favorite-dropdown')[0];
                        dd.style.borderTop = "1px solid #f0edeb";
                        dd.style.borderTopLeftRadius = "5px";
                        dd.style.minWidth = "190px";
                    }
                } else {waitCount++; if (waitCount <= 100) setTimeout(function(){gclh_load_score(waitCount);}, 100);}
            }
            gclh_load_score(0);
        } catch(e) {gclh_error("Show favorite percentage",e);}
    }

// Highlight usercoords.
    if (is_page("cache_listing")) {
        try {
            var css = (settings_highlight_usercoords ? ".myLatLon {color: #FF0000; " : ".myLatLon {color: unset; ")
                    + (settings_highlight_usercoords_bb ? "border-bottom: 2px solid #999; " : "border-bottom: unset; ")
                    + (settings_highlight_usercoords_it ? "font-style: italic;}" : "font-style: unset;}");
            appendCssStyle(css);
        } catch(e) {gclh_error("Highlight usercoords",e);}
    }

// Show other coord formats listing, print page.
    if (is_page("cache_listing") && $('#uxLatLon')[0]) {
        try {
            var box = $('#ctl00_ContentBody_LocationSubPanel')[0];
            box.innerHTML = box.innerHTML.replace("<br>", "");
            var coords = $('#uxLatLon')[0].innerHTML;
            otherFormats(" - ");
            box.innerHTML = "<font style='font-size: 10px;'>" + box.innerHTML + "</font><br>";
        } catch(e) {gclh_error("Show other coord formats listing",e);}
    }
    if (document.location.href.match(/\.com\/seek\/cdpf\.aspx/)) {
        try {
            var box = document.getElementsByClassName("UTM Meta")[0];
            var coords = document.getElementsByClassName("LatLong Meta")[0];
            if (box && coords) {
                var match = coords.innerHTML.match(/((N|S) [0-9][0-9]. [0-9][0-9]\.[0-9][0-9][0-9] (E|W) [0-9][0-9][0-9]. [0-9][0-9]\.[0-9][0-9][0-9])/);
                if (match && match[1]) {
                    coords = match[1];
                    otherFormats("<br>");
                }
            }
        } catch(e) {gclh_error("Show other coord formats print page",e);}
    }
    function otherFormats(trenn) {
        var dec = toDec(coords);
        var lat = dec[0];
        var lng = dec[1];
        if (lat < 0) lat = "S "+(lat * -1);
        else lat = "N "+lat;
        if (lng < 0) lng = "W "+(lng * -1);
        else lng = "E "+lng;
        box.innerHTML += trenn+"Dec: "+lat+" "+lng;
        var dms = DegtoDMS(coords);
        box.innerHTML += trenn+"DMS: "+dms;
    }

// Map this Location.
    if (is_page("cache_listing") && $('#uxLatLon')[0]) {
        try {
            var coords = toDec($('#uxLatLon')[0].innerHTML);
            if ($('#uxLatLonLink')[0] != null) var link = $('#uxLatLonLink')[0].parentNode;
            else var link = $('#uxLatLon')[0].parentNode;
            var small = document.createElement("small");
            small.innerHTML = '<a href="'+map_url+'?ll='+coords[0]+','+coords[1]+'">Map this Location</a>';
            link.append(small);
        } catch(e) {gclh_error("Map this Location",e);}
    }

// Improve Ignore, Stop Ignoring, Watch button handling.
    if ((settings_show_remove_ignoring_link && settings_use_one_click_ignoring) || settings_use_one_click_watching) {
        var css = '';
        css += ".working {opacity: 0.3; cursor: default;}";
        css += "#ignoreSaved, #watchSaved {display: none; color: #E0B70A; float: right;}";
        appendCssStyle(css);
    }

// Improve Ignore, Stop Ignoring button handling.
    if (is_page("cache_listing") && settings_show_remove_ignoring_link && $('#ctl00_ContentBody_GeoNav_uxIgnoreBtn')[0]) {
        try {
            // Set Ignore.
            changeIgnoreButton('Ignore');

            // Prepare one click Ignore, Stop Ignoring.
            if (settings_use_one_click_ignoring) {
                var link = '#ctl00_ContentBody_GeoNav_uxIgnoreBtn a';
                $(link).attr('data-url', $(link)[0].href);
                $(link)[0].href = 'javascript:void(0);';
                $(link)[0].addEventListener("click", oneClickIgnoring, false);
                changeIgnoreButton('Ignore');
                var saved = document.createElement('span');
                saved.setAttribute('id', 'ignoreSaved');
                saved.appendChild(document.createTextNode('saved'));
                $('#ctl00_ContentBody_GeoNav_uxIgnoreBtn')[0].append(saved);
            }

            // Set Stop Ignoring.
            var bmLs = $('.BookmarkList').last().find('li a[href*="/bookmarks/view.aspx?guid="], li a[href*="/profile/?guid="]');
            for (var i=0; (i+1) < bmLs.length; i=i+2) {
                if (bmLs[i].innerHTML.match(/^Ignore List$/) && bmLs[i+1] && bmLs[i+1].innerHTML == global_me) {
                    changeIgnoreButton('Stop Ignoring');
                    break;
                }
            }
        } catch(e) {gclh_error("Improve Ignore, Stop Ignoring button handling",e);}
    }
    function oneClickIgnoring() {
        var link = '#ctl00_ContentBody_GeoNav_uxIgnoreBtn a';
        if ($(link+'.working')[0]) return;
        $(link).addClass('working');

        var url = $(link)[0].getAttribute('data-url');

        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            onload: function(response) {
                var viewstate = encodeURIComponent(response.responseText.match(/id="__VIEWSTATE" value="([0-9a-zA-Z+-\/=]*)"/)[1]);
                var viewstategenerator = (response.responseText.match(/id="__VIEWSTATEGENERATOR" value="([0-9A-Z]*)"/))[1];
                var postData = '__EVENTTARGET=&__EVENTARGUMENT=&__VIEWSTATE=' + viewstate + '&__VIEWSTATEGENERATOR=' + viewstategenerator
                             + '&navi_search=&ctl00%24ContentBody%24btnYes=Yes.+Ignore+it.';

                GM_xmlhttpRequest({
                    method: 'POST',
                    url: url,
                    data: postData,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Referer': url
                    },
                    onload: function(response) {
                        if (response.responseText.indexOf('<p class="Success">') !== -1) {
                            // If cache was just ignored, set button to stop ignoring.
                            if (response.responseText.indexOf('<strong>') !== -1) {
                                changeIgnoreButton('Stop Ignoring', 'saved');
                            // If cache was just restored, set button to ignore.
                            } else {
                                changeIgnoreButton('Ignore', 'saved');
                            }
                        }
                        $(link).removeClass('working');
                    },
                    onerror: function(response) {$(link).removeClass('working');},
                    ontimeout: function(response) {$(link).removeClass('working');},
                    onabort: function(response) {$(link).removeClass('working');}
                });
            }
        });
    }
    function changeIgnoreButton(buttonSetTo, saved) {
        var link = '#ctl00_ContentBody_GeoNav_uxIgnoreBtn a';
        if (saved && saved == 'saved') {
            $('#ignoreSaved')[0].style.display = 'inline';
            $('#ignoreSaved').fadeOut(2500, 'swing');
        }
        $(link)[0].innerHTML = buttonSetTo;
        $(link)[0].style.backgroundImage = (buttonSetTo == 'Ignore' ? 'url(/images/icons/16/ignore.png)' : 'url('+global_stop_ignore_icon+')');
    }

// Improve Watch button handling. (Not for Stop Watching handling.)
    if (is_page("cache_listing") && settings_use_one_click_watching && $('#ctl00_ContentBody_GeoNav_uxWatchlistBtn a')[0] && !$('#ctl00_ContentBody_GeoNav_uxWatchlistBtn a')[0].href.match(/action=rem/)) {
        try {
            // Prepare one click watching.
            var link = '#ctl00_ContentBody_GeoNav_uxWatchlistBtn a';
            $(link).attr('data-url', $(link)[0].href);
            var wID = $(link)[0].href.match(/aspx\?w=([0-9]+)/);
            $(link).attr('data-wID', wID[1]);
            $(link)[0].href = 'javascript:void(0);';
            $(link)[0].addEventListener("click", oneClickWatching, false);
            changeWatchButton($(link)[0].innerHTML);
            var saved = document.createElement('span');
            saved.setAttribute('id', 'watchSaved');
            saved.appendChild(document.createTextNode('saved'));
            $('#ctl00_ContentBody_GeoNav_uxWatchlistBtn')[0].append(saved);
        } catch(e) {gclh_error("Improve Watch button handling.",e);}
    }
    function oneClickWatching() {
        var link = '#ctl00_ContentBody_GeoNav_uxWatchlistBtn a';
        if ($(link+'.working')[0]) return;
        $(link).addClass('working');

        var url = $(link)[0].getAttribute('data-url');
        var nr = $('#ctl00_ContentBody_GeoNav_uxWatchlistBtn')[0].childNodes[1].data.replace(/\(|\)|\s/g, '');

        // Watching.
        if (!url.match(/action=rem/)) {
            GM_xmlhttpRequest({
                method: 'POST',
                url: url,
                onload: function(response) {
                    if (response.responseText.indexOf('ctl00_ContentBody_lbAction') !== -1) {
                        // Cache was just watched, set button to stop watching.
                        nr++;
                        changeWatchButton('Stop Watching', 'saved', nr);
                    }
                    $(link).removeClass('working');
                },
                onerror: function(response) {$(link).removeClass('working');},
                ontimeout: function(response) {$(link).removeClass('working');},
                onabort: function(response) {$(link).removeClass('working');}
            });
        }
    }
    function changeWatchButton(buttonSetTo, saved, nr) {
        var link = '#ctl00_ContentBody_GeoNav_uxWatchlistBtn a';
        if (saved && saved == 'saved') {
            $('#watchSaved')[0].style.display = 'inline';
            $('#watchSaved').fadeOut(2500, 'swing');
        }
        $(link)[0].innerHTML = buttonSetTo;
        $(link)[0].style.backgroundImage = (buttonSetTo == 'Watch' ? 'url(/images/icons/16/watch.png)' : 'url(/images/icons/16/stop_watching.png)');
        if (nr) $('#ctl00_ContentBody_GeoNav_uxWatchlistBtn')[0].childNodes[1].data = ' (' + nr + ')';
        if (buttonSetTo != 'Watch') {
            $(link)[0].removeEventListener("click", oneClickWatching);
            var wID = $(link)[0].getAttribute('data-wID');
            var urlNew = '/my/watchlist.aspx?' + (buttonSetTo == 'Watch' ? 'w='+wID : 'ds=1&id='+wID+'&action=rem');
            $(link)[0].href = urlNew;
        }
    }

// Improve Add to list in cache listing.
    if (is_page("cache_listing") && settings_improve_add_to_list && $('.btn-add-to-list')[0]) {
        try {
            var height = ((parseInt(settings_improve_add_to_list_height) < 100) ? parseInt(100) : parseInt(settings_improve_add_to_list_height));
            var css = ".loading {background: url(/images/loading2.gif) no-repeat center !important;}"
                    + ".add-list {max-height: " + height + "px !important;}"
                    + ".add-list li {padding: 2px 0 !important;}"
                    + ".add-list li button {font-size: 14px !important; margin: 0 !important; height: 18px !important;}"
                    + ".status {font-size: 14px !important; margin: 0 !important; top: 8px !important; width: unset !important; right: 0px !important;}"
                    + ".status .loading {top: -6px !important; right: 0px !important; padding: 0 2px !important; background-color: white !important; background: url(/images/loading2.gif) no-repeat center;}"
                    + ".status.success, .success-message {right: 2px !important; padding: 0 5px !important; background-color: white !important; color: #E0B70A !important;}";
            appendCssStyle(css);
            $('.btn-add-to-list')[0].addEventListener("click", function() {window.scroll(0, 0);});
        } catch(e) {gclh_error("Improve Add to list",e);}
    }

// Add link to waypoint list and cache logs to right sidebar.
    if (is_page("cache_listing") && $("#cache_logs_container")[0]) {
        try {
            if (getWaypointTable().length > 0) {
                $(".CacheDetailNavigation:first > ul:first").append('<li><a href="#ctl00_ContentBody_bottomSection">Go to Waypoint list</a></li>');
            }
            $("#cache_logs_container").prev("div").attr('id','logs_section');
            $(".CacheDetailNavigation:first > ul:first").append('<li><a href="#logs_section">Go to logs</a></li>');
            var css = "";
            css += '.CacheDetailNavigation a[href*="#ctl00_ContentBody_bottomSection"]{background-image:url(/images/icons/16/waypoints.png);}';
            css += '.CacheDetailNavigation a[href*="#logs_section"]{background-image:url(' + global_logs_icon + ');}';
            appendCssStyle(css);
        } catch(e) {gclh_error("Add link to waypoint list and cache logs",e);}
    }

// Button to copy data to clipboard at right sidebar.
    function create_copydata_menu() {
        var css = "";
        css += ".copydata-content-layer {";
        css += "  color: black;";
        css += "  padding: 5px 12px 5px 14px;";
        css += "  text-decoration: none;";
        css += "  display: block;}";
        css += ".copydata-content-layer:hover {";
        css += "  background-color: #e1e1e1;";
        css += "  cursor: pointer;}";
        css += ".copydata-sidebar-icon {";
        css += "  background-image: url(" + global_copy_icon + ")}";
        appendCssStyle(css);
        var html = "";
        var orgFlag = false;
        html += '<div class="GClhdropdown">';
        html += '<a class="GClhdropbtn copydata_click copydata-sidebar-icon" data-id="'+idCopyName+'">Copy Data to Clipboard</a>';
        html += '<div class="GClhdropdown-content" id="CopyDropDown">';
        html += '<div class="copydata-content-layer copydata_click" data-id="'+idCopyName+'">Cache Name</div>';
        html += '<div class="copydata-content-layer copydata_click" data-id="'+idCopyCode+'">GC Code</div>';
        html += '<div class="copydata-content-layer copydata_click" data-id="'+idCopyUrl+'">Cache Link</div>';
        // check for original coords
        if (unsafeWindow.mapLatLng != undefined) {
           if (unsafeWindow.mapLatLng.isUserDefined == true ) {
              orgFlag = true;
           }
        }
        if (orgFlag) {
           html += '<div class="copydata-content-layer copydata_click" data-id="'+idCopyCoords+'">Corrected Coordinates</div>';
           html += '<div class="copydata-content-layer copydata_click" data-id="'+idCopyOrg+'">Original Coordinates</div>';
        } else {
           html += '<div class="copydata-content-layer copydata_click" data-id="'+idCopyCoords+'">Coordinates</div>';
        }
        html += '</div>'
        html += '</div>';
        $('.CacheDetailNavigation ul').first().append('<li>'+html+'</li>');
        $('.copydata_click').click(function() {
            copydata_copy( this );
        });
    }

    function copydata_copy( thisObject ) {
        const el = document.createElement('textarea');
        switch ($(thisObject).data('id')) {
            case idCopyName:
                el.value = $('#ctl00_ContentBody_CacheName')[0].innerHTML.replace(new RegExp('&nbsp;', 'g'),' ');
                break;
            case idCopyCode:
                el.value = $('#ctl00_ContentBody_CoordInfoLinkControl1_uxCoordInfoCode')[0].innerHTML;
                break;
            case idCopyUrl:
                el.value = "https://coord.info/"+$('#ctl00_ContentBody_CoordInfoLinkControl1_uxCoordInfoCode')[0].innerHTML;
                break;
            case idCopyCoords:
                el.value = $('#uxLatLon')[0].innerHTML;
                break;
            case idCopyOrg:
                el.value = unsafeWindow.mapLatLng.oldLatLngDisplay.replace(new RegExp('\'', 'g'),'');
                break;
            default:
                el.value = "";
        }
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        $('#CopyDropDown')[0].style.visibility = 'hidden';
        setTimeout(function() { $('#CopyDropDown')[0].style.visibility = 'unset'; }, 100);
    }

// Links BRouter, Flopps Map, GPSVisualizer and Openrouteservice at right sidebar.
    const LatLonDigits = 6;

    function mapservice_link( service_configuration ) {
        var uniqueServiceId = service_configuration.uniqueServiceId;

        var css = "";
        css += "."+uniqueServiceId+"-content-layer {";
        css += "  color: black;";
        css += "  padding: 5px 16px 5px 16px;";
        css += "  text-decoration: none;";
        css += "  display: block;}";
        css += "."+uniqueServiceId+"-content-layer:hover {";
        css += "  background-color: #e1e1e1;";
        css += "  cursor: pointer;}";
        if ( service_configuration.sidebar.icon ) {
            css += "."+uniqueServiceId+"-sidebar-icon {";
            css += "  background-image: url(" + service_configuration.sidebar.icondata + ")}";
        }
        if ( service_configuration.waypointtable.icon ) {
            css += "."+uniqueServiceId+"-waypointtable-icon {";
            css += "  background-image: url(" + service_configuration.waypointtable.icondata + ")}";
        }
        css += ".noGClhdropbtn {";
        css += "  display: none !important;}";
        appendCssStyle(css);

        var html = "";
        html += '<div class="GClhdropdown">';
        html += '<a class="GClhdropbtn mapservice_click-{uniqueServiceId} {customclasses}" data-map="'+service_configuration.defaultMap+'">{linkText}</a>';
        var nodropbtn = (service_configuration.defaultMap == "" ? "noGClhdropbtn" : "");
        html += '<div class="GClhdropdown-content '+nodropbtn+'">';
        for( var layer in service_configuration.layers ) {
            html += '<div class="{uniqueServiceId}-content-layer mapservice_click-{uniqueServiceId}" data-map="'+layer+'">'+service_configuration.layers[layer].displayName+'</div>';
        }
        html += '</div>';
        html += '</div>';
        html = html.replace(/{uniqueServiceId}/g,uniqueServiceId);

        // Add map service link to the right sidebar.
        var htmlSidebar = html.replace('{linkText}', service_configuration.sidebar.linkText);
        htmlSidebar = htmlSidebar.replace('{customclasses}', ( service_configuration.sidebar.icon )?uniqueServiceId+'-sidebar-icon':'');
        $('.CacheDetailNavigation ul').first().append('<li>'+htmlSidebar+'</li>');

        // Add map service link under waypoint table.
        var tbl = getWaypointTable();
        if (tbl.length > 0) {
            var htmlWaypointTable = html.replace('{linkText}', service_configuration.waypointtable.linkText);
            htmlWaypointTable = htmlWaypointTable.replace('{customclasses}',( service_configuration.waypointtable.icon )?uniqueServiceId+'-waypointable-icon':'');
            tbl.next("p").append('<br>'+htmlWaypointTable);
        }

        $('.mapservice_click-'+uniqueServiceId).click(function() {
            service_configuration.action( this, service_configuration );
        });
    }

    function mapservice_open( thisObject, service_configuration ) {
        var waypoints = queryListingWaypoints(true);
        if (service_configuration.useHomeCoords == true) {
            var homeCoords = {
                name: 'Home coordinates',
                gccode: $('#ctl00_ContentBody_CoordInfoLinkControl1_uxCoordInfoCode')[0].innerHTML,
                prefix: "",
                source: "GClh Config",
                typeid: '',
                latitude: (getValue("home_lat") / 10000000),
                longitude: (getValue("home_lng") / 10000000),
                prefixedName: $('#ctl00_ContentBody_CoordInfoLinkControl1_uxCoordInfoCode')[0].innerHTML,
            };
            waypoints.unshift(homeCoords); // Vorne anfügen.
        }
        if (!service_configuration.runWithOneWaypoint && waypoints.length == 1) {
            waypoints.push(waypoints[0]);
        }

        var map = $(thisObject).data('map');
        var data = {
            urlTemplate: service_configuration.urlTemplate,
            map: map,
            maxZoomLevel: service_configuration.layers[map].maxZoom,
            waypoints: waypoints,
            waypointSeparator: service_configuration.waypointSeparator,
            waypointFunction: service_configuration.waypointFunction,
            context: service_configuration.context,
            mapOffset: service_configuration.mapOffset,
            useHomeCoords: service_configuration.useHomeCoords,
            runWithOneWaypoint: service_configuration.runWithOneWaypoint
        };

        var url = data.urlTemplate;
        var waypointString = "";
        var boundarybox = undefined;

        if ( data.context == undefined ) data.context = {};
        if ( data.temp == undefined ) data.context.temp = {};
        data.context.temp.count = 0;

        for (var i=0; i<data.waypoints.length; i++) {
            var waypoint = data.waypoints[i];
            var value = "";
            var radius = 0;
            var name = "";

            if (waypoint.source == "waypoint") {
                data.context.temp.count++;
                radius = ((waypoint.typeid == 219 /*Physical Stage*/ || waypoint.typeid == 220 /*Final Location*/ ) ? 161 : 0);
                name = normalizeName(waypoint.prefixedName);
            } else if (waypoint.source == "original" ) {
                radius = 0;
                if (waypoint.typeid == 2 /* Traditional Geocache */ ) radius = 161; //  161m radius
                else if (waypoint.typeid == 8 /* Mystery cache */) radius = 3000; // Mystery cache 3000m radius
                name = normalizeName(waypoint.gccode+'_ORIGINAL');
            } else if (waypoint.source == "listing" ) {
                radius = 0;
                if (waypoint.typeid == 2 /* Traditional Geocache */ ) radius = 161; //  161m radius
                else if (waypoint.typeid == 8 /* Mystery cache */) radius = 3000; // Mystery cache 3000m radius
                name = normalizeName(waypoint.gccode);
            } else if (waypoint.source == "GClh Config" ) {
                radius = 0;
                name = normalizeName(waypoint.gccode);
            } else {
                gclh_log("xxxWaypoint() - unknown waypoint.source ("+waypoint.source+")");
            }

            value = data.waypointFunction( waypoint, name, radius, data.context );
            if (value != "") {
                waypointString += (i?data.waypointSeparator:'') + value;
                boundarybox = BoundaryBox( boundarybox, data.waypoints[i].latitude, data.waypoints[i].longitude );
            }
        }

        var zoom = TileMapZoomLevelForBoundaryBox( boundarybox, data.mapOffset.width, data.mapOffset.height, data.maxZoomLevel );

        url = url.replace("{center_latitude}",roundTO( boundarybox.center.latitude,LatLonDigits));
        url = url.replace("{center_longitude}",roundTO( boundarybox.center.longitude,LatLonDigits));
        url = url.replace("{zoom}",zoom);
        url = url.replace("{map}",data.map);
        url = url.replace("{waypoints}",waypointString);
        url = encodeURI(url);

        if ( url.length > service_configuration.maxUrlLength ) {
            alert("Pay attention the URL is very long ("+url.length+" characters). Data loss is possible.");
        }
        window.open(url);
    }

    function BoundaryBox( boundarybox, latitude, longitude ) {
        boundarybox = boundarybox == undefined ? { Latmax : -90.0, Latmin : 90.0, Lonmax : -180.0, Lonmin : 180.0, center : { latitude : 0.0, longitude : 0.0 } } : boundarybox;
        boundarybox.Latmax = Math.max(boundarybox.Latmax, latitude);
        boundarybox.Latmin = Math.min(boundarybox.Latmin, latitude);
        boundarybox.Lonmax = Math.max(boundarybox.Lonmax, longitude);
        boundarybox.Lonmin = Math.min(boundarybox.Lonmin, longitude);
        boundarybox.center.latitude = ((boundarybox.Latmax+90.0)+(boundarybox.Latmin+90.0))/2-90.0;
        boundarybox.center.longitude = ((boundarybox.Lonmax+180.0)+(boundarybox.Lonmin+180.0))/2-180.0;
        return boundarybox;
    }

    function TileMapZoomLevelForBoundaryBox( boundarybox, widthOffset, heightOffset, maxZoom ) {
        var browserZoomLevel = window.devicePixelRatio;
        var mapWidth = Math.round(window.innerWidth*browserZoomLevel)+widthOffset;
        var mapHeigth = Math.round(window.innerHeight*browserZoomLevel)+heightOffset;
        var zoom=-1;
        for (zoom=23; zoom>=0; zoom--) {
            // Calculate tile boundary box.
            var tileY_min = lat2tile(boundarybox.Latmin,zoom);
            var tileY_max = lat2tile(boundarybox.Latmax,zoom);
            var tiles_Y = Math.abs(tileY_min-tileY_max+1);  // boundary box heigth in number of tiles
            var tileX_min = long2tile(boundarybox.Lonmin,zoom);
            var tileX_max = long2tile(boundarybox.Lonmax,zoom);
            var tiles_X = Math.abs(tileX_max-tileX_min+1);  // boundary box width in  number of tiles
            // Calculate width and height of boundary rectangle (in pixel).
            var latDelta = Math.abs(tile2lat(tileY_max,zoom)-tile2lat(tileY_min+1,zoom));
            var latPixelPerDegree = tiles_Y*256/latDelta;
            var boundaryHeight = latPixelPerDegree*Math.abs(boundarybox.Latmax-boundarybox.Latmin);
            var longDelta = Math.abs(tile2long(tileX_max+1,zoom)-tile2long(tileX_min,zoom));
            var longPixelPerDegree = tiles_X*256/longDelta;
            var boundaryWidth = longPixelPerDegree*Math.abs(boundarybox.Lonmax-boundarybox.Lonmin);
            if ( ((boundaryHeight < mapHeigth) && (boundaryWidth < mapWidth)) && zoom<=maxZoom ) break;
        }
        return zoom;
    }

    function normalizeName( name ) {return name.replace(/[^a-zA-Z0-9_\-]/g,'_');}

    function floppsMapWaypoint(waypoint, name, radius, context) {
        var id = "";
        if (waypoint.source == "waypoint") {
            id = String.fromCharCode(65+Math.floor(context.temp.count%26))+Math.floor(context.temp.count/26+1);  // create Flopp's Map id: A1, B1, C1, ..., Z1, A2, B2, C3, ..
        } else if (waypoint.source == "original" ) {
            id = "O";
        } else if (waypoint.source == "listing" ) {
            id = "L";
        }
        return id+':'+roundTO(waypoint.latitude,LatLonDigits)+':'+roundTO(waypoint.longitude,LatLonDigits)+':'+radius+':'+name;
    }

    function gpsvisualizerWaypoint(waypoint, name, radius, context) {
        var symbol = ( settings_show_gpsvisualizer_gcsymbols && waypoint.typeid in urlPinIcons ) ? urlPinIcons[waypoint.typeid] : "";
        var type = ( settings_show_gpsvisualizer_typedesc && waypoint.typeid in waypointNames ) ? waypointNames[waypoint.typeid] : "";
        return name+","+roundTO(waypoint.latitude,LatLonDigits)+','+roundTO(waypoint.longitude,LatLonDigits)+','+radius+"m,"+type+","+symbol;
    }

    function brouterWaypoint(waypoint, name, radius, context) {
        var value = "";
        if (waypoint.source == "waypoint" || waypoint.source == "listing") {
            value = roundTO(waypoint.longitude,LatLonDigits)+','+roundTO(waypoint.latitude,LatLonDigits);
        } else if (waypoint.source == "original" ) {
            value = "";
        }
        return value;
    }

    function openrouteserviceWaypoint(waypoint, name, radius, context) {
        return roundTO(waypoint.latitude,LatLonDigits)+','+roundTO(waypoint.longitude,LatLonDigits);
    }

// CSS for BRouter, Flopp's Map, GPSVisualizer, Openrouteservice and Copy Data links.
    if ( (settings_show_brouter_link || settings_show_flopps_link || settings_show_gpsvisualizer_link || settings_show_openrouteservice_link || settings_show_copydata_menu) && is_page("cache_listing") ) {
        css += ".GClhdropbtn {";
        css += "  white-space: nowrap;";
        css += "  cursor: pointer;}";
        css += ".GClhdropdown {";
        css += "  position: relative;";
        css += "  display: inline-block;}";
        css += ".GClhdropdown-content {";
        css += "  display: none;";
        css += "  position: absolute;";
        css += "  background-color: #f9f9f9;";
        css += "  min-width: 170px;";
        css += "  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);";
        css += "  z-index: 1001;}";
        css += ".GClhdropdown-content-info {";
        css += "  color: black;";
        css += "  background-color: #ffffa5;";
        css += "  padding: 5px 16px 5px 16px;";
        css += "  text-decoration: none;";
        css += "  display: none;}";
        css += ".GClhdropdown-content-info:hover {";
        css += "  background-color: #ffffa5;";
        css += "  cursor: default;}";
        css += ".GClhdropdown:hover .GClhdropdown-content {";
        css += "  display: block;}";
        appendCssStyle(css);

        // Show links which open Flopp's Map with all waypoints of a cache.
        if ( settings_show_flopps_link ) {
            try {
                mapservice_link( {
                    uniqueServiceId: "flopps",
                    urlTemplate: 'http://flopp.net/?c={center_latitude}:{center_longitude}&z={zoom}&t={map}&d=O:C&m={waypoints}',
                    layers: {'OSM': { maxZoom: 18, displayName: 'Openstreetmap' }, 'OSM/DE': { maxZoom: 18, displayName: 'OSM German Style' }, 'TOPO': { maxZoom: 15, displayName: 'OpenTopMap' }, 'roadmap':{ maxZoom: 20, displayName: 'Google Maps' }, 'hybrid': { maxZoom: 20, displayName: 'Google Maps Hybrid' }, 'terrain':{ maxZoom: 20, displayName: 'Google Maps Terrain' }, 'satellite':{ maxZoom: 20, displayName: 'Google Maps Satellite' }},
                    waypointSeparator : '*',
                    waypointFunction : floppsMapWaypoint,
                    mapOffset : { width: -280, height: -50 },
                    defaultMap : 'OSM',
                    sidebar : { linkText : "Show on Flopp\'s Map", icon : true, icondata : global_flopps_map_icon },
                    waypointtable : { linkText : "Show waypoints on Flopp\'s Map with &#8230;", icon : false },
                    maxUrlLength: 2000,
                    action: mapservice_open,
                    context : {},
                    useHomeCoords: false,
                    runWithOneWaypoint: true
                });
            } catch(e) {gclh_error("Show Flopp's Map links",e);}
        }
        // Show links which open BRouter with all waypoints of a cache.
        if ( settings_show_brouter_link ) {
            try {
                mapservice_link( {
                    uniqueServiceId: "brouter",
                    urlTemplate: 'http://brouter.de/brouter-web/#map={zoom}/{center_latitude}/{center_longitude}/{map}&lonlats={waypoints}',
                    layers: {'OpenStreetMap': { maxZoom: 18, displayName: 'OpenStreetMap' }, 'OpenStreetMap.de': { maxZoom: 17, displayName: 'OSM German Style' }, 'OpenTopoMap': { maxZoom: 17, displayName: 'OpenTopoMap' }, 'Esri World Imagery': { maxZoom: 18, displayName: 'Esri World Imagery' }},
                    waypointSeparator : ';',
                    waypointFunction : brouterWaypoint,
                    mapOffset : { width: 0, height: 0 },
                    defaultMap : 'OpenStreetMap',
                    sidebar : { linkText : "Show on BRouter", icon : true, icondata : global_brouter_icon },
                    waypointtable : { linkText : "Show route on BRouter with &#8230;", icon : false },
                    maxUrlLength: 4000,
                    action: mapservice_open,
                    context : {},
                    useHomeCoords: false,
                    runWithOneWaypoint: true
                });
            } catch(e) {gclh_error("Show button BRouter and open BRouter",e);}
        }
        // Show links which open GPSVisualizer with all waypoints of a cache.
        if ( settings_show_gpsvisualizer_link ) {
            try {
                mapservice_link( {
                    uniqueServiceId: "gpsvisualizer",
                    urlTemplate: 'http://www.gpsvisualizer.com/map_input?&width=1244&height=700&trk_list=0&wpt_list=desc_border&bg_map={map}&google_zoom_level=auto&google_street_view=1&google_wpt_labels=1&form:data=name,latitude,longitude,circle_radius,desc,symbol\n{waypoints}',
                    layers: { 'google_map' : { displayName: 'Google street map', maxZoom: 20 }, 'google_satellite' : { displayName: 'Google satellite', maxZoom: 20 }, 'google_hybrid' : { displayName: 'Google hybrid', maxZoom: 20 }, 'google_physical' : { displayName: 'Google terrain', maxZoom: 20 }, 'google_openstreetmap' : { displayName: 'OpenStreetMap', maxZoom: 20 }, 'google_openstreetmap_tf' : { displayName: 'OSM ThunderForest', maxZoom: 20 }, 'google_openstreetmap_komoot' : { displayName: 'OSM Komoot', maxZoom: 20 }, 'google_opencyclemap' : { displayName: 'OpenCycleMap', maxZoom: 20 }, 'google_opentopomap' : { displayName: 'OpenTopoMap', maxZoom: 20 }, 'google_4umaps' : { displayName: 'World topo maps', maxZoom: 20 }},
                    waypointSeparator : '\n',
                    waypointFunction : gpsvisualizerWaypoint,
                    mapOffset : { width: 0, height: 0 },
                    defaultMap : 'google_map',
                    sidebar : { linkText : "Show on GPSVisualizer", icon : true, icondata : global_gpsvisualizer_icon },
                    waypointtable : { linkText : "Show waypoints on GPSVisualizer with &#8230;", icon : false },
                    maxUrlLength: 4000,
                    action: mapservice_open,
                    context : {},
                    useHomeCoords: false,
                    runWithOneWaypoint: true
                });
            } catch(e) {gclh_error("Show button GPSVisualizer and open GPSVisualizer",e);}
        }
        // Show links which open Openrouteservice with all waypoints of a cache.
        if ( settings_show_openrouteservice_link ) {
            try {
                mapservice_link( {
                    uniqueServiceId: "openrouteservice",
                    urlTemplate: 'https://maps.openrouteservice.org/directions?b='+settings_show_openrouteservice_medium+'&c=0&a={waypoints}',
                    layers: {'': { maxZoom: '', displayName: ''}},
                    waypointSeparator: ',',
                    waypointFunction: openrouteserviceWaypoint,
                    mapOffset: {width: 0, height: 0},
                    defaultMap: '',
                    sidebar: {linkText: "Show on Openrouteservice", icon: true, icondata: global_openrouteservice_icon},
                    waypointtable: {linkText: "Show route on Openrouteservice", icon: false},
                    maxUrlLength: 4000,
                    action: mapservice_open,
                    context: {},
                    useHomeCoords: settings_show_openrouteservice_home,
                    runWithOneWaypoint: false
                });
            } catch(e) {gclh_error("Show button Openrouteservice and open Openrouteservice",e);}
        }
        // Show 'Copy Data to Clipboard' Menu
        if (settings_show_copydata_menu ) {
           try {
               create_copydata_menu();
           } catch(e) {gclh_error("Create Menu 'Copy Data to Clipboard'",e);}
        }
    }

// Build map overview.
    if (settings_map_overview_build && is_page("cache_listing") && $('#ctl00_ContentBody_detailWidget')[0]) {
        try {
            leafletInit();

            var html = "";
            html += "<div class='CacheDetailNavigationWidget' style='margin-top: 1.5em;'>";
            html += "<div id='gclh_map_overview' class='WidgetBody' style='padding: 0; height: 248px; width: 248px;'>";
            html += "</div>";
            html += "</div>";
            $(".CacheDetailNavigation").after(html);

            var previewMap = L.map('gclh_map_overview', {
                  dragging: true,
                  zoomControl: true,
            }).setView([lat, lng],settings_map_overview_zoom);

            var layer = ( settings_map_overview_layer == "" || settings_map_overview_layer == "Geocaching" ) ? all_map_layers['OpenStreetMap Default'] : all_map_layers[settings_map_overview_layer];
            var layerObj = L.tileLayer( layer.tileUrl, layer ).addTo(previewMap);

            // delayed load of Groudspeaks map layer (we need an access token)
            if ( settings_map_overview_layer == "Geocaching" ) {
                gclh_GetGcAccessToken( function(r) {
                    all_map_layers["Geocaching"].accessToken = r.access_token;

                    var layer = all_map_layers['Geocaching'];
                    L.tileLayer( layer.tileUrl, layer ).addTo(previewMap);

                    previewMap.eachLayer(function (layer) {
                        if ( layerObj == layer ) previewMap.removeLayer(layer);
                    });
                });
            }

            // make buttons of zoom control smaller only for overview map
            $("#gclh_map_overview .leaflet-bar").attr("style","width: 20px; height: 41px; line-height: 40px;");
            $("#gclh_map_overview .leaflet-control-zoom-in").attr("style","width: 20px; height: 20px; line-height: 20px; font-size: 11px; padding-right: 1px;");
            $("#gclh_map_overview .leaflet-control-zoom-out").attr("style","width: 20px; height: 20px; line-height: 20px; font-size: 11px; padding-right: 1px;");
            // Länge der Kartenbezeichnung ... begrenzen.
            $("#gclh_map_overview .leaflet-control-attribution").attr("style","max-width: 238px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;");

            var marker = L.marker([lat, lng],{icon: L.icon({
                iconUrl: 'http://www.geocaching.com/images/wpttypes/pins/' + unsafeWindow.mapLatLng.type + '.png',
                iconSize: [20, 23],
                iconAnchor: [10, 23],
            })}).addTo(previewMap);

        } catch(e) {gclh_error("Build map overview",e);}
    }

// Personal Cache Note at cache listing.
    if (is_page("cache_listing")) {

        // Personal Cache Note: Adapt height of edit field for Personal Cache Note
        function calcHeightOfCacheNote() {
            return $("#viewCacheNote").parent().height()*1.02+36;
        }

        if (settings_adapt_height_cache_notes) {
            try {
                var note = ($('.Note.PersonalCacheNote')[0] || $('.NotesWidget')[0]);
                if ( note ) {
                    $("#cacheNoteText").height(calcHeightOfCacheNote());
                }
            } catch(e) {gclh_error("Adapt size of edit field for personal cache note",e);}
        }

        // Personal Cache Note: Hide complete and Show/Hide Cache Note.
        try {
            var note = ($('.Note.PersonalCacheNote')[0] || $('.NotesWidget')[0]);
            if (settings_hide_cache_notes && note) note.remove();
            if (settings_hide_empty_cache_notes && !settings_hide_cache_notes && note) {
                var desc = decode_innerHTML(note.getElementsByTagName("label")[0]).replace(":", "");
                var noteText = $('#viewCacheNote')[0].innerHTML;
                var link = document.createElement("font");
                link.setAttribute("style", "font-size: 12px;");
                link.innerHTML = "<a id='gclh_hide_note' href='javascript:void(0);' onClick='gclhHideNote();'>Hide "+desc+"</a>";
                note.setAttribute("id", "gclh_note");
                note.parentNode.insertBefore(link, note);
                if (noteText != null && (noteText == "" || noteText == "Click to enter a note" || noteText == "Klicken zum Eingeben einer Notiz" || noteText == "Pro vložení poznámky klikni sem")) {
                    note.style.display = "none";
                    if ($('#gclh_hide_note')[0]) $('#gclh_hide_note')[0].innerHTML = 'Show '+desc;
                }
                var code =
                    "function gclhHideNote() {" +
                    "  if(document.getElementById('gclh_note').style.display == 'none') {" +
                    "    document.getElementById('gclh_note').style.display = 'block';" +
                    "    if (document.getElementById('gclh_hide_note')) {" +
                    "      document.getElementById('gclh_hide_note').innerHTML = 'Hide "+desc+"'" +
                    "    }" +
                    "  } else {" +
                    "    document.getElementById('gclh_note').style.display = 'none';" +
                    "    if (document.getElementById('gclh_hide_note')) {" +
                    "      document.getElementById('gclh_hide_note').innerHTML = 'Show "+desc+"'" +
                    "    }" +
                    "  }" +
                    "}";
                injectPageScript(code, 'body');
            }
        } catch(e) {gclh_error("Hide complete and Show/Hide Cache Note",e);}

        // Personal Cache Note: Focus Cachenote-Textarea on Click of the Note (to avoid double click to edit)
        try
        {
            var editCacheNote = document.querySelector('#editCacheNote');
            if(editCacheNote){
                var observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        if (mutation.type == "attributes") {
                            if(document.getElementById('editCacheNote').style.display == ''){
                                document.getElementById('cacheNoteText').focus();
                            } else {
                                // take the parent, because empty lines are not handle by span-element #viewCacheNote
                                if (  $("#cacheNoteText").height() != calcHeightOfCacheNote() ) {
                                    $("#cacheNoteText").height(calcHeightOfCacheNote());
                                }
                            }
                        }
                    });
                });

                observer.observe(editCacheNote, {
                  attributes: true //configure it to listen to attribute changes
                });
            }
        } catch(e) {gclh_error("Focus Cachenote-Textarea on Click of the Note",e);}
    }

// Show eMail and Message Center Link beside user. (Nicht in Cache Logs im Listing, das erfolgt später bei Log-Template.)
    show_mail_and_message_icon:
    try {
        // Cache, TB, Aktiv User Infos ermitteln.
        var [global_gc, global_tb, global_code, global_name, global_link, global_activ_username, global_founds, global_date, global_time, global_dateTime] = getGcTbUserInfo();
        // Nicht auf Mail, Message Seite ausführen.
        if ($('#ctl00_ContentBody_SendMessagePanel1_SendEmailPanel')[0] || $('#messageArea')[0]) break show_mail_and_message_icon;

        if ((settings_show_mail || settings_show_message)) {
            // Public Profile:
            if (is_page("publicProfile")) {
                if ($('#lnkSendMessage')[0] || $('#ctl00_ProfileHead_ProfileHeader_lnkSendMessage')[0]) {
                    var guid = ($('#lnkSendMessage')[0] || $('#ctl00_ProfileHead_ProfileHeader_lnkSendMessage')[0]).href.match(/https?:\/\/www\.geocaching\.com\/account\/messagecenter\?recipientId=(.*)/);
                    guid = guid[1];
                    if ($('#ctl00_ContentBody_ProfilePanel1_lblMemberName, #ctl00_ProfileHead_ProfileHeader_lblMemberName')[0]) {
                        var username = decode_innerHTML($('#ctl00_ContentBody_ProfilePanel1_lblMemberName, #ctl00_ProfileHead_ProfileHeader_lblMemberName')[0]);
                        var side = $('#ctl00_ContentBody_ProfilePanel1_lblMemberName, #ctl00_ProfileHead_ProfileHeader_lblStatusText')[0];
                    }
                    buildSendIcons(side, username, "per guid");
                }
            // Post Cache new log page:
            } else if (document.location.href.match(/\.com\/play\/geocache\/gc\w+\/log/)) {
                if ($('.muted')[0] && $('.muted')[0].children[1]) {
                    var id = $('.muted')[0].children[1].href.match(/^https?:\/\/www\.geocaching\.com\/profile\/\?id=(\d+)/);
                    if (id && id[1]) {
                        var idLink = "/p/default.aspx?id=" + id[1] + "&tab=geocaches";
                        GM_xmlhttpRequest({
                            method: "GET",
                            url: idLink,
                            onload: function(response) {
                                if (response.responseText) {
                                    var [username, guid] = getUserGuidFromProfile(response.responseText);
                                    if (username && guid) {
                                        var side = $('.muted')[0].children[1];
                                        buildSendIcons(side, username, "per guid", guid);
                                    }
                                }
                            }
                        });
                    }
                }
            // Audit Log
            // ----------
            } else if (document.location.href.match(/\.com\/seek\/auditlog\.aspx/)) {
                var links = document.getElementsByTagName('a');
                for (var i = 0; i < links.length; i++) {
                    if (links[i].href.match(/profile\?guid=/)) {
                        side = $(links[i]);
                        guid = side.attr('href').substring(14,36+14);
                        username = side.text();
                        buildSendIcons(side[0], username, "per guid", guid);
                    }
                }
            // Rest:
            } else {
                if (is_page("cache_listing")) var links = $('#divContentMain .span-17, #divContentMain .sidebar').find('a[href*="/profile/?guid="]');
                else var links = document.getElementsByTagName('a');
                for (var i = 0; i < links.length; i++) {
                    if (links[i].href.match(/https?:\/\/www\.geocaching\.com\/profile\/\?guid=/)) {
                        // Avatare haben auch mal guid, hier keine Icons erzeugen.
                        if (links[i].children[0] && (links[i].children[0].tagName == "IMG" || links[i].children[0].tagName == "img")) continue;
                        var guid = links[i].href.match(/https?:\/\/www\.geocaching\.com\/profile\/\?guid=(.*)/);
                        guid = guid[1];
                        var username = decode_innerHTML(links[i]);
                        buildSendIcons(links[i], username, "per guid");
                    }
                }
            }
        }
    } catch(e) {gclh_error("Show mail and message icon",e);}

// Banner zu neuen Themen entfernen.
    if (settings_remove_banner) {
        try {
            if (settings_remove_banner_for_garminexpress) $('#Content').find('div.banner').find('#uxSendToGarminBannerLink').closest('div.banner').remove();
            if (settings_remove_banner_blue) {
                if ($('div.banner').length == 1 && $('div.banner').find('div.wrapper a.btn').length == 1) {
                    var styles = window.getComputedStyle($('div.banner')[0]);
                    if (styles && (styles.backgroundColor == "rgb(70, 135, 223)" || styles.backgroundColor == "rgb(61, 118, 197)")) $('div.banner').remove();
                }
                $('#activationAlert').find('div.container').find('a[href*="/my/lists.aspx"]').closest('#activationAlert').remove();
            }
        } catch(e) {gclh_error("Remove banner",e);}
    }

// Activate fancybox for pictures in the description.
    if (is_page("cache_listing")) {
        try {
            if (typeof unsafeWindow.$.fancybox != "undefined") unsafeWindow.$('.CachePageImages a[rel="lightbox"]').fancybox();
        } catch(e) {gclh_error("Activate fancybox",e);}
    }

// Link to bigger pictures for owner added images.
    if (settings_link_big_listing && is_page("cache_listing")) {
        try {
            var img = $('#ctl00_ContentBody_LongDescription, .CachePageImages').find('img[src*="geocaching.com/cache/large/"]');
            var a = $('#ctl00_ContentBody_LongDescription, .CachePageImages').find('a[href*="geocaching.com/cache/large/"]');
            for (var i = 0; i < img.length; i++) {img[i].src = img[i].src.replace("/large/", "/");}
            for (var i = 0; i < a.length; i++) {a[i].href = a[i].href.replace("/large/", "/");}
        } catch(e) {gclh_error("Link to bigger pictures for owner added images",e);}
    }

// Decrypt hints.
    if (settings_decrypt_hint && !settings_hide_hint && is_page("cache_listing")) {
        try {
            if ($('#ctl00_ContentBody_EncryptionKey')[0]) {
                if (browser == "chrome") injectPageScript("(function(){dht();})()");
                else unsafeWindow.dht($('#ctl00_ContentBody_lnkDH')[0]);
                var decryptKey = $('#dk')[0];
                if (decryptKey) decryptKey.parentNode.removeChild(decryptKey);
            }
        } catch(e) {gclh_error("Decrypt hints",e);}
    }
    if (settings_decrypt_hint && document.location.href.match(/\.com\/seek\/cdpf\.aspx/)) {
        try {
            if ($('#uxDecryptedHint')[0]) $('#uxDecryptedHint')[0].style.display = 'none';
            if ($('#uxEncryptedHint')[0]) $('#uxEncryptedHint')[0].style.display = '';
            if ($('.EncryptionKey')[0]) $('.EncryptionKey')[0].remove();
        } catch(e) {gclh_error("Decrypt cdpf hints",e);}
    }

// Hide hints.
    if (settings_hide_hint && is_page("cache_listing")) {
        try {
            // Replace hints by a link which shows the hints dynamically.
            var hint = $('#div_hint')[0];
            var label = $('#ctl00_ContentBody_hints strong')[0];
            if (hint && label && trim(hint.innerHTML).length > 0) {
                var code =
                    "function hide_hint() {" +
                    "  var hint = document.getElementById('div_hint');" +
                    "  if(hint.style.display == 'none') {" +
                    "    hint.style.display = 'block';" +
                    "    if (document.getElementById('ctl00_ContentBody_lnkDH')) {" +
                    "      document.getElementById('ctl00_ContentBody_lnkDH').innerHTML = 'Hide'" +
                    "    }" +
                    "  } else {" +
                    "    hint.style.display = 'none';" +
                    "    if (document.getElementById('ctl00_ContentBody_lnkDH')) {" +
                    "      document.getElementById('ctl00_ContentBody_lnkDH').innerHTML = 'Show'" +
                    "    }" +
                    "  }" +
                    "    hint.innerHTML = convertROTStringWithBrackets(hint.innerHTML);" +
                    "  return false;" +
                    "}";
                injectPageScript(code, 'body');
                if ($('#ctl00_ContentBody_lnkDH')[0]) {
                    var link = $('#ctl00_ContentBody_lnkDH')[0];
                    link.setAttribute('onclick', 'hide_hint();');
                    link.setAttribute('title', 'Show/Hide ' + decode_innerHTML(label));
                    link.setAttribute('href', 'javascript:void(0);');
                    link.setAttribute('style', 'font-size: 12px;');
                    link.innerHTML = 'Show';
                }
                hint.style.marginBottom = '1.5em';
                hint.style.display = 'none';
            }
            // Remove hint description.
            var decryptKey = $('#dk')[0];
            if (decryptKey) decryptKey.parentNode.removeChild(decryptKey);
        } catch(e) {gclh_error("Hide hints",e);}
    }

// Improve inventory list in cache listing.
    if (is_page("cache_listing")) {
        try {
            // Trackable Namen kürzen, damit nicht umgebrochen wird, und Title setzen.
            var inventory = $('#ctl00_ContentBody_uxTravelBugList_uxInventoryLabel').closest('.CacheDetailNavigationWidget').find('.WidgetBody span');
            for (var i = 0; i < inventory.length; i++) {noBreakInLine(inventory[i], 201, inventory[i].innerHTML);}
        } catch(e) {gclh_error("Improve inventory list",e);}
    }

// Show Google-Maps Link on Cache Listing Page.
    if (settings_show_google_maps && is_page("cache_listing") && $('#ctl00_ContentBody_uxViewLargerMap')[0] && $('#uxLatLon')[0] && $('#ctl00_ContentBody_CoordInfoLinkControl1_uxCoordInfoCode')[0]) {
        try {
            var ref_link = $('#ctl00_ContentBody_uxViewLargerMap')[0];
            var box = ref_link.parentNode;
            box.appendChild(document.createElement("br"));
            var link = document.createElement("a");
            link.setAttribute("class", "lnk");
            link.setAttribute("target", "_blank");
            link.setAttribute("title", "Show area on Google Maps");
            var coords = toDec($('#uxLatLon')[0].innerHTML);
            var latlng = coords[0] + "," + coords[1];
            // &ll sorgt für Zentrierung der Seite beim Marker auch wenn linke Sidebar aufklappt. Zoom 18 setzen, weil GC Map eigentlich nicht mehr kann.
            link.setAttribute("href", "https://maps.google.de/maps?q=" + latlng + "&ll=" + latlng + "&z=18");
            var img = document.createElement("img");
            img.setAttribute("src", "/images/silk/map_go.png");
            link.appendChild(img);
            link.appendChild(document.createTextNode(" "));
            var span = document.createElement("span");
            span.appendChild(document.createTextNode("Show area on Google Maps"));
            link.appendChild(span);
            box.appendChild(link);
        } catch(e) {gclh_error("Show google maps link",e);}
    }

// Hide spoilerwarning above the logs.
    if (settings_hide_spoilerwarning && is_page("cache_listing")) {
        try {
            if ($('.InformationWidget .NoBottomSpacing a[href*="/glossary.aspx#spoiler"]')[0]) {
                var sp = $('.InformationWidget .NoBottomSpacing a[href*="/glossary.aspx#spoiler"]')[0].closest('p');
                if (sp) {
                    sp.innerHTML = "&nbsp;";
                    sp.style.height = "0";
                    sp.className += " Clear";
                }
            }
        } catch(e) {gclh_error("Hide spoilerwarning",e);}
    }

// Hide warning message.
    if (settings_hide_warning_message) {
        if ($('.WarningMessage')[0]) {
            try {
                var content = '"' + $('.WarningMessage')[0].innerHTML + '"';
                if (content == getValue("warningMessageContent")) {
                    warnMessagePrepareMouseEvents();
                } else {
                    // Button in Warnmeldung aufbauen, um Meldung erstes Mal zu verbergen.
                    var div = document.createElement("div");
                    div.setAttribute("class", "GoAwayWarningMessage");
                    div.setAttribute("title", "Go away message");
                    div.setAttribute("style", "float: right; width: 70px; color: rgb(255, 255, 255); box-sizing: border-box; border: 2px solid rgb(255, 255, 255); opacity: 0.7; cursor: pointer; border-radius: 3px; margin-right: 2px; margin-top: 2px; text-align: center;");
                    div.appendChild(document.createTextNode("Go away"));
                    div.addEventListener("click", warnMessageHideAndSave, false);
                    $('.WarningMessage')[0].parentNode.insertBefore(div, $('.WarningMessage')[0]);
                }
            } catch(e) {gclh_error("Hide warning message",e);}
        }
    }
    // Warnmeldung verbergen und Inhalt sichern.
    function warnMessageHideAndSave() {
        $('.WarningMessage').fadeOut(1000, "linear");
        var content = '"' + $('.WarningMessage')[0].innerHTML + '"';
        setValue("warningMessageContent", content);
        $('.GoAwayWarningMessage')[0].style.display = "none";
        warnMessagePrepareMouseEvents();
    }
    // Mouse Events vorbereiten für show/hide Warnmeldung.
    function warnMessagePrepareMouseEvents() {
        // Balken im rechten Headerbereich zur Aktivierung der Warnmeldung.
        var divShow = document.createElement("div");
        divShow.setAttribute("class", "ShowWarningMessage");
        divShow.setAttribute("style", "z-index: 1004; float: right; right: 0px; width: 6px; background-color: rgb(224, 183, 10); height: 65px; position: absolute;");
        $('.WarningMessage')[0].parentNode.insertBefore(divShow, $('.WarningMessage')[0]);
        // Bereich für Mouseout Event, um Warnmeldung zu verbergen. Notwendig, weil eigentliche Warnmeldung nicht durchgängig da und zukünftiges Aussehen unklar.
        var divHide = document.createElement("div");
        divHide.setAttribute("class", "HideWarningMessage");
        divHide.setAttribute("style", "z-index: 1004; height: 110px; position: absolute; right: 0px; left: 0px;");
        $('.WarningMessage')[0].parentNode.insertBefore(divHide, $('.WarningMessage')[0]);
        warnMessageMouseOut();
    }
    // Show Warnmeldung.
    function warnMessageMouseOver() {
        $('.ShowWarningMessage')[0].style.display = "none";
        $('.WarningMessage')[0].style.display = "";
        $('.HideWarningMessage')[0].style.display = "";
        $('.HideWarningMessage')[0].addEventListener("mouseout", warnMessageMouseOut, false);
    }
    // Hide Warnmeldung.
    function warnMessageMouseOut() {
        $('.WarningMessage')[0].style.display = "none";
        $('.HideWarningMessage')[0].style.display = "none";
        $('.ShowWarningMessage')[0].style.display = "";
        $('.ShowWarningMessage')[0].addEventListener("mouseover", warnMessageMouseOver, false);
    }

// Driving direction for every waypoint.
    if (settings_driving_direction_link && (is_page("cache_listing") || document.location.href.match(/\.com\/hide\/wptlist.aspx/))) {
        try {
            var tbl = getWaypointTable();
            var length = tbl.find("tbody > tr").length;
            for (var i=0; i<length/2; i++) {
                var row1st = tbl.find("tbody > tr").eq(i*2);
                var name = row1st.find("td:eq(4)").text().trim();
                var icon = row1st.find("td:eq(1) > img").attr('src');
                var cellCoordinates = row1st.find("td:eq(5)");
                var tmp_coords = toDec(cellCoordinates.text().trim());
                if ((!settings_driving_direction_parking_area || icon.match(/pkg.jpg/g)) && typeof tmp_coords[0] !== 'undefined' && typeof tmp_coords[1] !== 'undefined') {
                    if (getValue("home_lat", 0) != 0 && getValue("home_lng") != 0) {
                        var link = "http://maps.google.com/maps?f=d&hl=en&saddr="+getValue("home_lat", 0)/10000000+","+getValue("home_lng", 0)/10000000+"%20(Home%20Location)&daddr=";
                        row1st.find("td:last").append('<a title="Driving Directions" href="'+link+tmp_coords[0]+","+tmp_coords[1]+" ("+name+')" target="_blank"><img src="/images/icons/16/directions.png"></a>');
                    } else {
                        var link = document.location + "&#gclhpb#errhomecoord";
                        row1st.find("td:last").append('<a title="Driving Directions" href="'+link+'"><img src="/images/icons/16/directions.png"></a>');
                    }
                }
            }
        } catch(e) {gclh_error("Driving direction for Waypoints",e);}
    }

// Added elevation to every additional waypoint with shown coordinates.
    if (settings_show_elevation_of_waypoints && ((is_page("cache_listing") && !isMemberInPmoCache()) || is_page("map"))) {
        try {
            function formatElevation(elevation) {
                return ((elevation>0)?"+":"")+((settings_distance_units != "Imperial")?(Math.round(elevation) + "m"):(Math.round(elevation*3.28084) + "ft"));
            }
            elevationServicesData[1]['function'] = addElevationToWaypoints_GoogleElevation;
            elevationServicesData[2]['function'] = addElevationToWaypoints_OpenElevation;
            elevationServicesData[3]['function'] = addElevationToWaypoints_GeonamesElevation;

            function addElevationToWaypoints_GoogleElevation(responseDetails) {
                try {
                    context = responseDetails.context;
                    json = JSON.parse(responseDetails.responseText);
                    if ( json.status != "OK") {
                        var mess = "\naddElevationToWaypoints_GoogleElevation():\n- Get elevations: retries: "+context.retries+"\n- json-status: "+json.status+"\n- json.error_message: "+json.error_message;
                        gclh_log(mess);
                        getElevations(context.retries+1,context.locations);
                        return;
                    }
                    var elevations = [];
                    for (var i=0; i<json.results.length; i++) {
                        if (json.results[i].location.lat != -90) elevations.push(json.results[i].elevation);
                        else elevations.push(undefined);
                    }
                    addElevationToWaypoints(elevations,context);
                } catch(e) {
                    gclh_error("addElevationToWaypoints_GoogleElevation()",e);
                    // This it not nice but in case of invalid character at the beginning of
                    // responseText JSON.parse gives an exception. Exception handling have to be improved
                    gclh_log( responseDetails.responseText );
                    getElevations(context.retries+1,context.locations);
                }
            }

            function addElevationToWaypoints_OpenElevation(responseDetails) {
                try {
                    context = responseDetails.context;
                    if ( responseDetails.responseText[0] != '{' ) {
                        // workaround: sometimes OpenElevation answers with an HTML formatted content not with JSON data
                        gclh_log("\naddElevationToWaypoints_OpenElevation():\n- Unexpected response data:"+responseDetails.responseText.substring(0,100)+"…");
                        getElevations(context.retries+1,context.locations);
                        return;
                    }

                    json = JSON.parse(responseDetails.responseText);
                    if ( 'error' in json ) {
                        gclh_log("\naddElevationToWaypoints_OpenElevation():\n- Error: "+json.error);
                        getElevations(context.retries+1,context.locations);
                        return;
                    } else if ( ! ('results' in json) )  {
                        gclh_log("\naddElevationToWaypoints_OpenElevation():\n- Results:"+json);
                        getElevations(context.retries+1,context.locations);
                        return;
                    } else {
                        var elevations = [];
                        for (var i=0; i<json.results.length; i++) {
                            if (json.results[i].latitude != -90) elevations.push(json.results[i].elevation);
                            else elevations.push(undefined);
                        }
                        addElevationToWaypoints(elevations,context);
                    }
                } catch(e) {
                    gclh_error("addElevationToWaypoints_OpenElevation()",e);
                    // This is not nice, but the OpenElevation service does not send any status information.
                    // We have to figure out, what will be send in case of error
                    gclh_log( responseDetails.responseText );
                    getElevations(context.retries+1,context.locations);
                }
            }

            function addElevationToWaypoints_GeonamesElevation(responseDetails) {
                try {
                    context = responseDetails.context;
                    if (responseDetails.responseText.match(/<html>/)) {
                        if (responseDetails.responseText.match(/Service Unavailable/)) {
                            gclh_log("\naddElevationToWaypoints_GeonamesElevation():\n- Info: Service Unavailable");
                        } else {
                            gclh_log("\naddElevationToWaypoints_GeonamesElevation():\n- Error:\n"+responseDetails.responseText);
                        }
                        getElevations(context.retries+1,context.locations);
                        return;
                    } else {
                        json = JSON.parse(responseDetails.responseText);
                        var elevations = [];
                        for (var i=0; i<json.geonames.length; i++) {
                            if (json.geonames[i].astergdem === -9999 || json.geonames[i].astergdem === -32768) elevations.push("0");
                            else elevations.push(json.geonames[i].astergdem);
                        }
                        addElevationToWaypoints(elevations,context);
                    }
                } catch(e) {gclh_error("addElevationToWaypoints_GeonamesElevation()",e);}
            }

            function addElevationToWaypoints(elevations,context) {
                try {
                    var text = "";
                    for (var i=0; i<elevations.length; i++) {
                        text = "n/a";
                        if (elevations[i] != undefined) text = formatElevation(elevations[i]);
                        if (is_page("map")) text = " " + text + " | ";
                        $("#elevation-waypoint-"+(i+context.additionalListingIndex)).html(text);
                        $("#elevation-waypoint-"+(i+context.additionalListingIndex)).attr('title','Elevation data from '+context.serviceName);
                    }
                } catch(e) {gclh_error("addElevationToWaypoints()",e);}
            }

            function prepareListingPageForElevations() {
                // prepare cache listing
                var waypoints = queryListingWaypoints();
                var locations = [];
                var classAttribute = "waypoint-elevation-na";
                var idAttribute = "";

                // prepare cache listing - listing coordinates
                classAttribute = "waypoint-elevation-na";
                idAttribute = "";
                for ( var j=0; j<waypoints.length; j++ ) {
                    var waypoint = waypoints[j];
                    if ( waypoint.source == "listing" ) {
                        classAttribute = "waypoint-elevation";
                        idAttribute = "elevation-waypoint-"+(locations.length);
                        locations.push(waypoint.latitude+","+waypoint.longitude);
                        break;
                    }
                }
                $("#uxLatLonLink").after('<span title="Elevation">&nbsp;&nbsp;&nbsp;Elevation:&nbsp;<span class="'+classAttribute+'" id="'+idAttribute+'"></span></span>');
                // prepare cache listing - waypoint table
                var tbl = getWaypointTable();
                if (tbl.length > 0) {
                    tbl.find("thead > tr > th:eq(5)").after('<th scope="col">Elevation</th>');
                    var length = tbl.find("tbody > tr").length;
                    for (var i=0; i<length/2; i++) {
                        var cellNote = tbl.find("tbody > tr:eq("+(i*2+1)+") > td:eq(1)");
                        var colspan = cellNote.attr('colspan');
                        cellNote.attr('colspan',colspan+1);
                        var row1st = tbl.find("tbody > tr").eq(i*2);
                        var cellPrefix = row1st.find("td:eq(2)").text().trim();

                        classAttribute = "waypoint-elevation-na";
                        idAttribute = "";
                        for ( var j=0; j<waypoints.length; j++ ) {
                            var waypoint = waypoints[j];
                            if ( waypoint.prefix == cellPrefix && waypoint.source == "waypoint" ) {
                                classAttribute = "waypoint-elevation";
                                idAttribute = "elevation-waypoint-"+(locations.length);
                                locations.push(waypoint.latitude+","+waypoint.longitude);
                                break;
                            }
                        }
                        row1st.find("td:eq(5)").after('<td><span class="'+classAttribute+'" id="'+idAttribute+'" ></span></td>');
                    }
                }
                return locations;
            }

            var elevationServices = [];
            if ( settings_primary_elevation_service > 0 ) {
                elevationServices.push(elevationServicesData[settings_primary_elevation_service]);
            }
            if ( settings_secondary_elevation_service > 0 ) {
                elevationServices.push(elevationServicesData[settings_secondary_elevation_service]);
            }

            // this function can be re-entered
            function getElevations(serviceIndex,locations) {
                if (serviceIndex >= elevationServices.length || elevationServices<0 ) {
                    $('.waypoint-elevation').each(function (index, value) {
                        $(this).html('<span title="Fail to load elevation data">???</span>');
                    });
                    return;
                }
                $('.waypoint-elevation').each(function (index, value) {
                    $(this).html('<img src="' + urlImages + 'ajax-loader.gif" title="Load elevation data for the waypoint from '+elevationServices[serviceIndex]['name']+'."/>');
                });
                $('.waypoint-elevation-na').each(function (index, value) {
                    $(this).html('n/a');
                });

                var additionalListingIndex = 0;
                if (elevationServices[serviceIndex].name == "Geonames-Elevation") {
                    var maxLocations = 20;
                    var countLocations = 0;
                    var lats = "";
                    var lngs = "";
                    for (var i=0; i<locations.length; i++) {
                        countLocations++;
                        var latlng = locations[i].split(",");
                        lats += (lats == "" ? latlng[0] : ","+latlng[0]);
                        lngs += (lngs == "" ? latlng[1] : ","+latlng[1]);
                        if (countLocations == maxLocations || i == (locations.length - 1)) {
                            var locationsstring = "lats="+lats+"&lngs="+lngs+"&username=gclh";
                            getElevationsPackage();
                            additionalListingIndex = additionalListingIndex + maxLocations;
                            countLocations = 0;
                            lats = "";
                            lngs = "";
                        }
                    }
                } else {
                    var locationsstring = locations.join('|');
                    getElevationsPackage();
                }

                function getElevationsPackage() {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: elevationServices[serviceIndex].url.replace('{locations}',locationsstring),
                        context: {
                            retries : serviceIndex,
                            serviceName : elevationServices[serviceIndex]['name'],
                            locations : locations,
                            additionalListingIndex : additionalListingIndex
                        },
                        onload: elevationServices[serviceIndex]['function'],
                        onerror: function(responseDetails) {
                            var context = responseDetails.context;
                            gclh_error("getElevations("+context.serviceName+")", { 'message': 'GM_xmlhttpRequest() reported error.', 'stack': '' });
                            console.log(responseDetails); // workaround gclh_log doesn't work for responseDetails. Error message 'TypeError: Function.prototype.toString called on incompatible object'
                            getElevations(context.retries+1,context.locations);
                        },
                        onreadystatechange: function(responseDetails) {
                        },
                        ontimeout: function(responseDetails) {
                            var context = responseDetails.context;
                            gclh_error("getElevations("+context.serviceName+")", { 'message': 'GM_xmlhttpRequest() reported timeout.', 'stack': '' });
                            console.log(responseDetails); // workaround gclh_log doesn't work for responseDetails. Error message 'TypeError: Function.prototype.toString called on incompatible object'
                            getElevations(context.retries+1,context.locations);
                        },
                        onabort: function(responseDetails) {
                            var context = responseDetails.context;
                            gclh_error("getElevations("+context.serviceName+")", { 'message': 'GM_xmlhttpRequest() reported abort.', 'stack': '' });
                            console.log(responseDetails); // workaround gclh_log doesn't work for responseDetails. Error message 'TypeError: Function.prototype.toString called on incompatible object'
                            getElevations(context.retries+1,context.locations);
                        },
                    });
                }
            }

            if (is_page("cache_listing")) {
                var locations = prepareListingPageForElevations();
                if ( locations.length > 0 ) getElevations(0,locations);
            }
        } catch(e) {gclh_error("AddElevation",e);}
    }

// Hide greenToTopButton.
    if (settings_hide_top_button) $("#topScroll").attr("id", "_topScroll").hide();

// Show Smilies und Log Templates old log page.
    if ((document.location.href.match(/\.com\/seek\/log\.aspx\?(id|guid|ID|wp|LUID|PLogGuid)\=/) || document.location.href.match(/\.com\/track\/log\.aspx\?(id|wid|guid|ID|LUID|PLogGuid)\=/)) &&
        $('#litDescrCharCount')[0] && $('#ctl00_ContentBody_LogBookPanel1_WaypointLink')[0] && $('#ctl00_ContentBody_LogBookPanel1_uxLogInfo')[0] && $('#uxDateVisited')[0]) {
        try {
            var [aGCTBName, aGCTBLink, aGCTBNameLink, aLogDate] = getGCTBInfo();
            var aOwner = decode_innerHTML($('#ctl00_ContentBody_LogBookPanel1_WaypointLink')[0].nextSibling.nextSibling.nextSibling.nextSibling.nextSibling);
            insert_smilie_fkt("ctl00_ContentBody_LogBookPanel1_uxLogInfo");
            insert_tpl_fkt();
            var liste = "";
            if (settings_show_bbcode) build_smilies();
            build_tpls();
            var box = $('#litDescrCharCount')[0];
            box.innerHTML = liste;
        } catch(e) {gclh_error("Smilies and Log Templates old log page",e);}
    }
// Show Smilies und Log Templates new log page.
    if (document.location.href.match(/\.com\/play\/geocache\/gc\w+\/log/) &&
        $('.muted')[0] && $('#LogDate')[0] && $('#logContent')[0] && $('#LogText')[0] && $('#reportProblemInfo')[0]) {
        try {
            var [aGCTBName, aGCTBLink, aGCTBNameLink, aLogDate] = getGCTBInfo(true);
            var aOwner = decode_innerHTML($('.muted')[0].children[1]);
            insert_smilie_fkt("LogText");
            insert_tpl_fkt(true);
            var liste = "";
            build_tpls(true);
            if (settings_show_bbcode) build_smilies(true);
            var box = document.createElement("div");
            box.innerHTML = liste;
            side = $('#reportProblemInfo')[0];
            side.parentNode.insertBefore(box, side);
            var css = "";
            css += ".flatpickr-wrapper {margin-bottom: unset !important; bottom: 6px !important;}";
            css += "#gclh_log_tpls {position: relative; max-width: 240px; width: unset; border: 1px solid #9b9b9b; box-shadow: none; height: 40px; padding-top: 5px;}";
            css += "select:hover, select:focus, select:active {background-image: url(/play/app/ui-icons/icons/global/caret-down-hover.svg);}";
            appendCssStyle(css);
        } catch(e) {gclh_error("Smilies and Log Templates new log page",e);}
    }
    // Script für insert Smilie by click.
    function insert_smilie_fkt(id) {
        var code = "function gclh_insert_smilie(aTag,eTag){";
        code += "  var input = document.getElementById('"+id+"');";
        code += "  if(typeof input.selectionStart != 'undefined'){";
        code += "    var start = input.selectionStart;";
        code += "    var end = input.selectionEnd;";
        code += "    var insText = input.value.substring(start, end);";
        code += "    input.value = input.value.substr(0, start) + aTag + insText + eTag + input.value.substr(end);";
        code += "    if (insText.length == 0) var pos = start + aTag.length;";
        code += "    else var pos = start + aTag.length + insText.length + eTag.length;";
        code += "    input.selectionStart = input.selectionEnd = pos;";
        code += "  }";
        code += "  input.focus();";
        // Auch im Log Preview zur Anzeige bringen.
        code += "  input.dispatchEvent(new KeyboardEvent('keyup', {'keyCode': 32}));";
        code += "}";
        injectPageScript(code, 'body');
    }
    // Script für insert Log Template by click.
    function insert_tpl_fkt(newLogPage) {
        finds = get_my_finds();
        var [aDate, aTime, aDateTime] = getDateTime();
        var me = global_me;
        aOwner = aOwner.replace(/'/g,"\\'");
        var code = "function gclh_insert_tpl(id){";
        if (newLogPage) {
            code += "  document.getElementById('gclh_log_tpls').value = -1;";
            code += "  var aLogDate = document.getElementById('LogDate').value;";
            code += "  var input = document.getElementById('LogText');";
        } else {
            code += "  var aLogDate = document.getElementById('uxDateVisited').value;";
            code += "  var input = document.getElementById('ctl00_ContentBody_LogBookPanel1_uxLogInfo');";
        }
        code += "  var finds = '" + finds + "';";
        code += "  var aDate = '" + aDate + "';";
        code += "  var aTime = '" + aTime + "';";
        code += "  var aDateTime = '" + aDateTime + "';";
        code += "  var me = '" + me + "';";
        code += "  var aGCTBName = '" + aGCTBName + "';";
        code += "  var aGCTBLink = '" + aGCTBLink + "';";
        code += "  var aGCTBNameLink = '" + aGCTBNameLink + "';";
        code += "  var settings_replace_log_by_last_log = " + settings_replace_log_by_last_log + ";";
        code += "  var owner = '" + aOwner + "';";
        code += "  var inhalt = document.getElementById(id).innerHTML;";
        code += "  inhalt = inhalt.replace(/\\&amp\\;/g,'&');";
        code += "  if (finds) {";
        code += "    inhalt = inhalt.replace(/#found_no#/ig, finds);";
        code += "    finds++;";
        code += "    inhalt = inhalt.replace(/#found#/ig, finds);";
        code += "  }";
        code += "  if (aDate) inhalt = inhalt.replace(/#Date#/ig, aDate);";
        code += "  if (aTime) inhalt = inhalt.replace(/#Time#/ig, aTime);";
        code += "  if (aDateTime) inhalt = inhalt.replace(/#DateTime#/ig, aDateTime);";
        code += "  if (me) inhalt = inhalt.replace(/#me#/ig, me);";
        code += "  if (aGCTBName) inhalt = inhalt.replace(/#GCTBName#/ig, aGCTBName);";
        code += "  if (aGCTBLink) inhalt = inhalt.replace(/#GCTBLink#/ig, aGCTBLink);";
        code += "  if (aGCTBNameLink) inhalt = inhalt.replace(/#GCTBNameLink#/ig, aGCTBNameLink);";
        code += "  if (aLogDate) inhalt = inhalt.replace(/#LogDate#/ig, aLogDate);";
        if (!newLogPage || settings_show_pseudo_as_owner) {
            code += "  if (owner) inhalt = inhalt.replace(/#owner#/ig, owner);";
        }
        code += "  if (id.match(/last_logtext/) && settings_replace_log_by_last_log) {";
        code += "    input.value = inhalt;";
        code += "  }else{";
        code += "    if (typeof input.selectionStart != 'undefined' && inhalt) {";
        code += "      var start = input.selectionStart;";
        code += "      var end = input.selectionEnd;";
        code += "      var insText = input.value.substring(start, end);";
        code += "      input.value = input.value.substr(0, start) + inhalt + input.value.substr(end);";
        code += "      var pos = start + inhalt.length;";
        code += "      input.selectionStart = input.selectionEnd = pos;";
        code += "    }";
        code += "  }";
        code += "  input.focus();";
        // Auch im Log Preview zur Anzeige bringen.
        code += "  input.dispatchEvent(new KeyboardEvent('keyup', {'keyCode': 32}));";
        code += "}";
        injectPageScript(code, 'body');
    }
    // Smilies aufbauen.
    function build_smilies(newLogPage) {
        var o = "<p style='margin: 5px;'>";
        if (newLogPage) liste += "<div style='float: right; margin-right: -5px; display: inline-block;'>";
        else liste += "<br>" + o;
        bs("[:)]", "");
        bs("[:D]", "_big");
        bs("[8D]", "_cool");
        bs("[:I]", "_blush");
        bs("[:P]", "_tongue");
        if (!newLogPage) liste += "</p>" + o;
        bs("[}:)]", "_evil");
        bs("[;)]", "_wink");
        bs("[:o)]", "_clown");
        bs("[B)]", "_blackeye");
        bs("[8]", "_8ball");
        if (newLogPage) liste += "<br>";
        else liste += "</p>" + o;
        bs("[:(]", "_sad");
        bs("[8)]", "_shy");
        bs("[:O]", "_shock");
        bs("[:(!]", "_angry");
        bs("[xx(]", "_dead");
        if (!newLogPage) liste += "</p>" + o;
        bs("[|)]", "_sleepy");
        bs("[:X]", "_kisses");
        bs("[^]", "_approve");
        bs("[V]", "_dissapprove");
        bs("[?]", "_question");
        if (newLogPage) liste += "</div>";
        else liste += "</p>";
        function bs(s, n) {liste += "<a href='#' onClick='gclh_insert_smilie(\"" + s + "\",\"\"); return false;'" + (newLogPage ? "style='margin: -2px;'" : "") + "><img src='/images/icons/icon_smile" + n + ".gif' title='" + s + " " + n.replace("_", "") + "' border='0'></a>&nbsp;&nbsp;";}
    }
    // Log Templates aufbauen.
    function build_tpls(newLogPage) {
        var texts = ""; var logicOld = ""; var logicNew = "";
        for (var i = 0; i < anzTemplates; i++) {
            if (getValue("settings_log_template_name["+i+"]", "") != "") {
                texts += "<div id='gclh_template["+i+"]' style='display: none;'>" + getValue("settings_log_template["+i+"]", "") + "</div>";
                logicOld += "<a href='#' onClick='gclh_insert_tpl(\"gclh_template["+i+"]\"); return false;' style='color: #000000; text-decoration: none; font-weight: normal;'> - " + getValue("settings_log_template_name["+i+"]", "") + "</a><br>";
                logicNew += "<option value='gclh_template["+i+"]' style='color: #4a4a4a;'>" + getValue("settings_log_template_name["+i+"]", "") + "</option>";
            }
        }
        if (getValue("last_logtext", "") != "") {
            texts += "<div id='gclh_template[last_logtext]' style='display: none;'>" + getValue("last_logtext", "") + "</div>";
            logicOld += "<a href='#' onClick='gclh_insert_tpl(\"gclh_template[last_logtext]\"); return false;' style='color: #000000; text-decoration: none; font-weight: normal;'> - [Last Cache-Log]</a><br>";
            logicNew += "<option value='gclh_template[last_logtext]' style='color: #4a4a4a;'>[Last Cache-Log]</option>";
        }
        if (newLogPage) {
            liste += "<br style='line-height: 40px'>" + texts;
            liste += "<select id='gclh_log_tpls' onChange='gclh_insert_tpl(this.value)'; class='gclh_form' style='color: #9b9b9b; display: initial; font-family: Noto Sans; font-size: 14px;'>";
            liste += "<option value='-1' selected='selected'" + "style='display: none; visibility: hidden;'>- Log Templates -</option>";
            liste += logicNew;
            liste += "</select>" + "<br>";
        } else liste += "<br><p style='margin: 0;'>Templates:</p>" + texts + logicOld;
    }
// Vorschau für Log, Log preview.
    if (document.location.href.match(/\.com\/play\/geocache\/gc\w+\/log/)) {
        try {
            var log_preview_wrapper =
                '<section class="region trackables-wrapper" id="log-previewPanel">' +
                    '<div>' +
                        '<button type="button" id="log-preview-button" class="btn btn-handle handle-open" data-open="false">Log Preview' +
                            '<svg height="24" width="24" class="icon icon-svg-fill sea">' +
                                '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/play/app/ui-icons/sprites/global.svg#icon-expand-svg-fill"></use>' +
                            '</svg>' +
                        '</button>' +
                        '<div class="inventory-panel" style="display: block;" id="log-preview-content">' +
                            '<div class="inventory-content mdd_preview markdown-output"></div>' +
                        '</div>' +
                    '</div>' +
                '</section>';

            // Add divs for Markdown Editor
            $('textarea.log-text').before('<div class="mdd_toolbar"></div>');
            $('textarea.log-text').after('<div class="mdd_resizer">');
            $('#trackablesPanel').before(log_preview_wrapper);

            var $mdEditor = $("textarea.log-text").MarkdownDeep({
                SafeMode :true,
                AllowInlineImages: false,
                ExtraMode: false,
                RequireHeaderClosingTag: true,
                disableShortCutKeys: true,
                DisabledBlockTypes: [
                    BLOCKTYPE_CONST.h4,
                    BLOCKTYPE_CONST.h5,
                    BLOCKTYPE_CONST.h6
                ],
                help_location: "/guide/markdown.aspx",
                active_modal_class: "modal-open",
                active_modal_selector: "html",
                additionalPreviewFilter: SmileyConvert()
            });

            $('#log-preview-button').click(function(){
                $('#log-preview-content').toggle();
                $('#log-previewPanel button').toggleClass('handle-open');
            });

            appendCssStyle('.markdown-output span.WaypointLog{color:#4a4a4a;display:block;font-weight:bold;margin-bottom:2em}.markdown-output{font-size:1.08em;line-height:1.375em;overflow:hidden;word-wrap:break-word}.markdown-output h1{color:#4a4a4a;font-size:1.285em;font-weight:bold;line-height:1.375em;margin:0}.markdown-output h2{color:#4a4a4a;font-size:1.285em;font-weight:normal;line-height:1.375em;margin:0}.markdown-output h3{color:#00b265;font-size:1.285em;font-weight:normal;line-height:1.375em;margin:0;text-transform:uppercase}.markdown-output hr{background:#d8d8d8;height:2px;margin:1.45em 0}.markdown-output p{color:#4a4a4a;margin:0 0 1.5em}.markdown-output li{list-style:inherit}.markdown-output ul{list-style-type:disc}.markdown-output ol{list-style-type:decimal}.markdown-output ul,.markdown-output ol{color:#4a4a4a;margin:0 1.5em 1.5em .75em;padding-left:1.5em}.markdown-output li ul{list-style-type:none;margin-left:0;margin-bottom:0;padding-left:0}.markdown-output li ul li::before{background-color:#e0b70a;border-radius:50%;content:"";display:inline-block;height:5px;margin-right:.75em;margin-top:-1px;width:5px;vertical-align:middle}.markdown-output li ol{margin-left:0;margin-bottom:0}.markdown-output blockquote{background:none;font-style:normal;margin:1.5em .75em;padding:0}.markdown-output blockquote p{color:#00b265;font-weight:bold}.markdown-output blockquote p::before{content:\'“\'}.markdown-output blockquote p::after{content:\'”\'}.markdown-output a,#bd .markdown-output a{color:#006cff;text-decoration:none}.markdown-output a:hover,.markdown-output a:focus{border-bottom:1px solid #006cff;color:#006cff}.markdown-output .AlignRight a{color:#00447c}.markdown-output .AlignRight a:visited{color:#00a0b0}.markdown-output .AlignRight a:hover,.markdown-output .AlignRight a:focus{border-bottom:none;color:#6c8e10}.markdown-output~.AlternatingRow,table .markdown-output~tr.AlternatingRow td{background:#fff}.markdown-output.BorderBottom td{border-bottom-color:#9b9b9b}.markdown-output.BorderBottom:last-child td{border-bottom:none}.markdown-output>td:last-child{padding-bottom:2.5em}');
        } catch(e) {gclh_error("Logpage Log Preview",e);}
    }
// Replicate TB-Header to bottom
    if (document.location.href.match(/\.com\/play\/geocache\/gc\w+\/log/)) {
        try {
            var checkExistTBHeader = setInterval(function() {
                if ($('#tbHeader .trackables-header').length) {

                    var visit_link = document.createElement("a");
                    visit_link.setAttribute("href", "javascript:void(0);");
                    visit_link.appendChild(document.createTextNode('Visit all'));
                    visit_link.addEventListener("click", function(){
                        $('#tbHeader .btn-visit').trigger( "click" );
                    });

                    var drop_link = document.createElement("a");
                    drop_link.setAttribute("href", "javascript:void(0);");
                    drop_link.appendChild(document.createTextNode('Drop all'));
                    drop_link.addEventListener("click", function(){
                        $('#tbHeader .btn-drop').trigger( "click" );
                    });

                    var clear_link = document.createElement("a");
                    clear_link.setAttribute("href", "javascript:void(0);");
                    clear_link.appendChild(document.createTextNode('Clear all'));
                    clear_link.addEventListener("click", function(){
                        $('#tbHeader .btn-clear').trigger( "click" );
                    });

                    var li = document.createElement("li");
                    li.classList.add('tb_action_buttons');
                    li.appendChild(clear_link);
                    li.appendChild(visit_link);
                    li.appendChild(drop_link);

                    $(".trackables-list").append(li);

                    var css =
                        ".tb_action_buttons{text-align:right;} " +
                        ".tb_action_buttons a{margin-right: 12px; text-decoration:underline;}" +
                        ".tb_action_buttons a:last-child{margin-right:0px;}"
                    appendCssStyle(css);

                    // Open Trackable Inventory
                    if(settings_auto_open_tb_inventory_list && $('#trackablesPanel .inventory-panel').css('display') == 'none'){
                        $("#trackablesPanel button.btn-handle").trigger( "click" );
                    }
                    clearInterval(checkExistTBHeader);
                }
            }, 500); // check every 500ms
        } catch(e) {gclh_error("Logpage Replicate TB-Header",e);}
    }

// Maxlength of logtext and unsaved warning.
    if ((document.location.href.match(/\.com\/seek\/log\.aspx\?(id|guid|ID|wp|LUID|PLogGuid)\=/) ||
         document.location.href.match(/\.com\/track\/log\.aspx\?(id|wid|guid|ID|LUID|PLogGuid)\=/)) && $('#litDescrCharCount')[0]) {
        try {
            var changed = false;
            function limitLogText(limitField) {
                changed = true;
                // Aus GC Funktion "checkLogInfoLength".
                var editor = $('#ctl00_ContentBody_LogBookPanel1_uxLogInfo');
                var limitNum = parseInt($('#ctl00_ContentBody_LogBookPanel1_uxLogInfo').attr("CKEMaxLength"));
                var length = editor.val().replace(/\n/g, "\r\n").length;
                var diff = length - editor.val().length;
                if (length > limitNum) {
                    limitField.value = limitField.value.substring(0, (limitNum - diff));
                    counterelement.innerHTML = '<font color="red">' + length + '/' + limitNum + '</font>';
                    limitField.scrollTop = limitField.scrollHeight;
                    limitField.selectionStart = 4000;
                    limitField.selectionEnd = 4000;
                } else counterelement.innerHTML = length + '/' + limitNum;
            }
            // Meldung bei ungespeichertem Log.
            window.onbeforeunload = function(e) {
                if (changed) {
                    var mess = "You have changed a log and haven't saved it yet. Do you want to leave this page and lose your changes?";
                    e.returnValue = mess;
                    return mess;
                }
            };
            if ($('#ctl00_ContentBody_LogBookPanel1_btnSubmitLog')[0]) $('#ctl00_ContentBody_LogBookPanel1_btnSubmitLog')[0].addEventListener("click", function() {changed = false;}, false);  // Keine Meldung beim Submit.
            var logfield = $('#ctl00_ContentBody_LogBookPanel1_uxLogInfo')[0];
            logfield.addEventListener("keyup", function() {limitLogText(logfield);}, false);
            logfield.addEventListener("change", function() {limitLogText(logfield);}, false);
            var counterpos = document.getElementById('litDescrCharCount').parentNode;
            var counterspan = document.createElement('p');
            counterspan.id = "logtextcounter";
            counterspan.innerHTML = "<b>Loglength:</b><br />";
            var counterelement = document.createElement('span');
            counterelement.innerHTML = "0/4000";
            counterspan.appendChild(counterelement);
            counterpos.appendChild(counterspan);
        } catch(e) {gclh_error("Maxlength of logtext and unsaved warning",e);}
    }

// Autovisit Old Log Page.
    if (settings_autovisit && document.location.href.match(/\.com\/seek\/log\.aspx/) && !document.location.href.match(/\.com\/seek\/log\.aspx\?LUID=/) && !document.getElementById('ctl00_ContentBody_LogBookPanel1_CoordInfoLinkControl1_uxCoordInfoCode')) {
        try {
            var tbs = getTbsO();
            if (tbs.length != 0) {
                for (var i = 0; i < tbs.length; i++) {
                    var [tbC, tbN] = getTbO(tbs[i].parentNode);
                    if (!tbC || !tbN) continue;
                    var auto = document.createElement("input");
                    auto.setAttribute("type", "checkbox");
                    auto.setAttribute("id", "gclh_"+tbC);
                    auto.setAttribute("value", tbN);
                    auto.addEventListener("click", setAutoO, false);
                    tbs[i].appendChild(auto);
                    tbs[i].appendChild(document.createTextNode(" AutoVisit"));
                }
                $('#ctl00_ContentBody_LogBookPanel1_ddLogType')[0].addEventListener("input", buildAutosO, false);
                buildAutosO(true);
                window.addEventListener("load", function(){buildAutosO(true);}, false);
            }
            function buildAutosO(start) {
                var type = getTypeO();
                var tbs = getTbsO();
                for (var i = 0; i < tbs.length; i++) {
                    var [tbC, tbN] = getTbO(tbs[i].parentNode);
                    setAutoO(tbC, tbN, type, start, true);
                }
                if (unsafeWindow.setSelectedActions) unsafeWindow.setSelectedActions();
            }
            function setAutoO(tbC, tbN, type, start, allTbs) {
                if (!type) var type = getTypeO();
                if (!tbC || !tbN) var [tbC, tbN] = getTbO(this.parentNode.parentNode);
                var options = $('#gclh_'+tbC)[0].parentNode.getElementsByTagName('option');
                var select = $('#gclh_'+tbC)[0].parentNode.getElementsByTagName('select');
                var autos = $('#gclh_'+tbC)[0];
                if (!type || !tbC || !tbN || !select[0] || options.length < 2 || !autos) return;
                if (start) {
                    if (getValue("autovisit_"+tbC, false)) autos.checked = true;
                    else autos.checked = false;
                }
                if (options.length == 2 || (options.length == 3 && select[0].selectedIndex != 1)) {
                    if (autos.checked == true) {
                        if (type == 2 || type == 10 || type == 11) select[0].selectedIndex = options.length - 1;
                        else select[0].selectedIndex = 0;
                    } else {
                        if (allTbs != true && (type == 2 || type == 10 || type == 11)) select[0].selectedIndex = 0;
                    }
                }
                setValue("autovisit_"+tbC, (autos.checked ? true:false));
            }
            function getTypeO() {return $('#ctl00_ContentBody_LogBookPanel1_ddLogType')[0].value;}
            function getTbsO() {return $('#tblTravelBugs tbody tr td select').closest('td');}
            function getTbO(tb) {return [$(tb).find('td a')[0].innerHTML, $(tb).find('td select option')[0].value];}
        } catch(e) {gclh_error("Autovisit Old",e);}
    }

// Default Log Type and Log Signature Old Log Page.
    // Cache:
    if (document.location.href.match(/\.com\/seek\/log\.aspx\?(id|guid|ID|PLogGuid|wp)\=/) && $('#ctl00_ContentBody_LogBookPanel1_ddLogType')[0] && $('#ctl00_ContentBody_LogBookPanel1_lbConfirm').length == 0) {
        try {
            // Logtype.
            if (!document.location.href.match(/\&LogType\=/) && !document.location.href.match(/PLogGuid/)) {
                var cache_type = document.getElementById("ctl00_ContentBody_LogBookPanel1_WaypointLink").nextSibling.childNodes[0].title;
                var select_val = "-1";
                if (cache_type.match(/event/i)) {
                    select_val = settings_default_logtype_event;
                } else if ($('.PostLogList').find('a[href*="https://www.geocaching.com/profile/?guid="]').text().trim() == global_me.trim()) {
                    select_val = settings_default_logtype_owner;
                } else select_val = settings_default_logtype;
                var select = document.getElementById('ctl00_ContentBody_LogBookPanel1_ddLogType');
                var childs = select.children;
                if (select.value == "-1") {
                    for (var i = 0; i < childs.length; i++) {
                        if (childs[i].value == select_val) select.selectedIndex = i;
                    }
                }
            }

            // Signature.
            var logtext = document.getElementById('ctl00_ContentBody_LogBookPanel1_uxLogInfo').value;
            var signature = getValue("settings_log_signature", "");
            // Cursorposition gegebenenfalls hinter Draft ermitteln.
            document.getElementById('ctl00_ContentBody_LogBookPanel1_uxLogInfo').innerHTML += "";
            var initial_cursor_position = document.getElementById('ctl00_ContentBody_LogBookPanel1_uxLogInfo').selectionEnd;
            // Draft.
            if (document.location.href.match(/\.com\/seek\/log\.aspx\?PLogGuid\=/)) {
                if (settings_log_signature_on_fieldnotes && !logtext.includes(signature)){
                    document.getElementById('ctl00_ContentBody_LogBookPanel1_uxLogInfo').innerHTML += signature;
                }
            // Kein Draft.
            } else{
                if(!logtext.includes(signature)){
                    document.getElementById('ctl00_ContentBody_LogBookPanel1_uxLogInfo').innerHTML += signature;
                }
            }
            replacePlaceholder();
            document.getElementById('ctl00_ContentBody_LogBookPanel1_uxLogInfo').selectionEnd = initial_cursor_position;
            // Auch im Log Preview zur Anzeige bringen.
            document.getElementById('ctl00_ContentBody_LogBookPanel1_uxLogInfo').dispatchEvent(new KeyboardEvent('keyup', {'keyCode': 32}));
        } catch(e) {gclh_error("Default Log-Type and Signature Old Log Page (CACHE)",e);}
    }
    // TB:
    if (document.location.href.match(/\.com\/track\/log\.aspx/) && $('#ctl00_ContentBody_LogBookPanel1_ddLogType')[0]) {
        try {
            // Logtype.
            if (settings_default_tb_logtype != "-1" && !document.location.href.match(/\&LogType\=/)) {
                var select = document.getElementById('ctl00_ContentBody_LogBookPanel1_ddLogType');
                var childs = select.children;
                for (var i = 0; i < childs.length; i++) {
                    if (childs[i].value == settings_default_tb_logtype) select.selectedIndex = i;
                }
            }

            // Signature.
            if ($('#ctl00_ContentBody_LogBookPanel1_uxLogInfo')[0] && $('#ctl00_ContentBody_LogBookPanel1_uxLogInfo')[0].innerHTML == "") $('#ctl00_ContentBody_LogBookPanel1_uxLogInfo')[0].innerHTML = getValue("settings_tb_signature", "");
            replacePlaceholder();
            document.getElementById('ctl00_ContentBody_LogBookPanel1_uxLogInfo').selectionEnd = 0;
            // Auch im Log Preview zur Anzeige bringen.
            document.getElementById('ctl00_ContentBody_LogBookPanel1_uxLogInfo').dispatchEvent(new KeyboardEvent('keyup', {'keyCode': 32}));
        } catch(e) {gclh_error("Default Log-Type and Signature (TB)",e);}
    }
// Log Signature New Log Page.
    if (document.location.href.match(/\.com\/play\/geocache\/gc\w+\/log/)) {
        try {
            checkLogType(0);
            function checkLogType(waitCount) {
                // Drafts ohne Signatur.
                if (document.location.href.match(/log\?d\=/) && document.getElementById('LogText').value != "" && !settings_log_signature_on_fieldnotes) {
                    // Auch im Log Preview zur Anzeige bringen.
                    document.getElementById('LogText').dispatchEvent(new KeyboardEvent('keyup', {'keyCode': 32}));
                }

                // Kein Draft oder Draft mit Signatur.
                if ((!document.location.href.match(/log\?d\=/) && $('.selectric')[0]) ||  // Kein Draft
                    (document.location.href.match(/log\?d\=/) && document.getElementById('LogText').value != "" && settings_log_signature_on_fieldnotes)) {  // Draft
                    var initial_cursor_position = document.getElementById('LogText').selectionEnd;
                    var logtext = document.getElementById('LogText').value;
                    var signature = getValue("settings_log_signature", "");
                    if(!logtext.includes(signature)){
                        document.getElementById('LogText').innerHTML = signature;
                    }
                    replacePlaceholder(true);
                    if (document.location.href.match(/log\?d\=/)) {
                        // 2 Zeilen sinngemäß von DieBatzen ausgeliehen, um "<" und ">" richtig darzustellen.
                        var textarea = document.createElement('textarea');
                        var value = $('<textarea>').html(document.getElementById('LogText').innerHTML).val();
                        document.getElementById('LogText').value += value;
                    }
                    document.getElementById('LogText').selectionEnd = initial_cursor_position;
                    // Auch im Log Preview zur Anzeige bringen.
                    document.getElementById('LogText').dispatchEvent(new KeyboardEvent('keyup', {'keyCode': 32}));
                } else {waitCount++; if (waitCount <= 1000) setTimeout(function(){checkLogType(waitCount);}, 10);}
            }
        } catch(e) {gclh_error("Signature New Log Page (CACHE)",e);}
    }
    function replacePlaceholder(newLogPage) {
        if (newLogPage) var id = "LogText";
        else var id = "ctl00_ContentBody_LogBookPanel1_uxLogInfo";
        window.addEventListener("load", gclh_setFocus, false);
        var finds = get_my_finds();
        var me = global_me;
        if (newLogPage) var owner = $('.muted')[0].children[1].childNodes[0].textContent;
        else var owner = document.getElementById('ctl00_ContentBody_LogBookPanel1_WaypointLink').nextSibling.nextSibling.nextSibling.nextSibling.nextSibling.innerHTML;
        document.getElementById(id).innerHTML = document.getElementById(id).innerHTML.replace(/#found_no#/ig, finds);
        finds++;
        if (!newLogPage || settings_show_pseudo_as_owner) document.getElementById(id).innerHTML = document.getElementById(id).innerHTML.replace(/#owner#/ig, owner);
        document.getElementById(id).innerHTML = document.getElementById(id).innerHTML.replace(/#found#/ig, finds).replace(/#me#/ig, me);
        var [aDate, aTime, aDateTime] = getDateTime();
        document.getElementById(id).innerHTML = document.getElementById(id).innerHTML.replace(/#Date#/ig, aDate).replace(/#Time#/ig, aTime).replace(/#DateTime#/ig, aDateTime);
        var [aGCTBName, aGCTBLink, aGCTBNameLink, aLogDate] = getGCTBInfo(newLogPage);
        document.getElementById(id).innerHTML = document.getElementById(id).innerHTML.replace(/#GCTBName#/ig, aGCTBName).replace(/#GCTBLink#/ig, aGCTBLink).replace(/#GCTBNameLink#/ig, aGCTBNameLink).replace(/#LogDate#/ig, aLogDate);
        // Set Cursor to Pos1.
        function gclh_setFocus() {
            var input = document.getElementById(id);
            if (input) {
                try {
                    input.selectionStart = 0;
                    input.selectionEnd = 0;
                    input.focus();
                } catch(e) {}
            }
        }
    }

// Last Log-Text speichern.
    if (document.location.href.match(/\.com\/seek\/log\.aspx/) || document.location.href.match(/\.com\/play\/geocache\/gc\w+\/log/)) {
        try {
            function sendOldLog(e) {setValue("last_logtext", $('#ctl00_ContentBody_LogBookPanel1_uxLogInfo')[0].value);}
            if ($('#ctl00_ContentBody_LogBookPanel1_btnSubmitLog')[0]) $('#ctl00_ContentBody_LogBookPanel1_btnSubmitLog')[0].addEventListener('click', sendOldLog, true);
            function sendNewLog(e) {setValue("last_logtext", $('#LogText')[0].value);}
            if ($('.btn-submit')[0] && $('.btn-submit')[0].parentNode) $('.btn-submit')[0].parentNode.addEventListener('click', sendNewLog, true);
        } catch(e) {gclh_error("Last Log-Text speichern",e);}
    }

// Hide socialshare.
    if (settings_hide_socialshare && document.location.href.match(/\.com\/seek\/log\.aspx?(.*)/)) {
        try {
            if ($('#sharing_container')[0]) $('#sharing_container')[0].style.display = "none";
            if ($('#uxSocialSharing')[0]) $('#uxSocialSharing')[0].style.display = "none";
        } catch(e) {gclh_error("Hide socialshare1",e);}
    }
    if (settings_hide_socialshare && document.location.href.match(/\.com\/play\/(friendleague|leaderboard)/)) {
        try {
            if ($('.btn.btn-facebook')[0]) {
                $('.btn.btn-facebook')[0].parentNode.style.display = "none";
                $('.btn.btn-facebook')[0].parentNode.previousElementSibling.style.display = "none";
                if ($('.share-button-group')[0]) $('.share-button-group')[0].style.marginBottom = "0";
            }
        } catch(e) {gclh_error("Hide socialshare2",e);}
    }

// Remove advertisement link.
    if (settings_hide_advert_link) {
        try {
            $('a[href*="advertising.aspx"]').remove();
        } catch(e) {gclh_error("Hide advertisement link",e);}
    }

// Improve Mail.
    if (settings_show_mail && document.location.href.match(/\.com\/email\//) && $('#ctl00_ContentBody_SendMessagePanel1_tbMessage')[0]) {
        try {
            // Prevent deleting content.
            injectPageScriptFunction(function(){
                var oldClearSearch = clearSearch;
                clearSearch = function(obj) {
                    if (obj.id !== "ctl00_ContentBody_SendMessagePanel1_tbMessage"){
                        oldClearSearch(obj);
                    }
                };
            },"()");
            // Set focus.
            $('#ctl00_ContentBody_SendMessagePanel1_tbMessage')[0].setAttribute("onfocus", "");
            // Default settings.
            $('#ctl00_ContentBody_SendMessagePanel1_chkSendAddress')[0].checked = getValue("email_sendaddress", "checked");
            $('#ctl00_ContentBody_SendMessagePanel1_chkEmailCopy')[0].checked = getValue("email_mailcopy", "checked");
            function chgDefaultSendaddress() {setValue("email_sendaddress", $('#ctl00_ContentBody_SendMessagePanel1_chkSendAddress')[0].checked);}
            function chgDefaultMailcopy() {setValue("email_mailcopy", $('#ctl00_ContentBody_SendMessagePanel1_chkEmailCopy')[0].checked);}
            $('#ctl00_ContentBody_SendMessagePanel1_chkSendAddress')[0].addEventListener("click", chgDefaultSendaddress, false);
            $('#ctl00_ContentBody_SendMessagePanel1_chkEmailCopy')[0].addEventListener("click", chgDefaultMailcopy, false);
            // Grab mail template from URL.
            var matches = document.location.href.match(/&text=(.*)/);
            if (matches && matches[1]) {
                $('#ctl00_ContentBody_SendMessagePanel1_tbMessage')[0].innerHTML = decodeUnicodeURIComponent(matches[1]);
            // Build mail template.
            } else {
                template = buildSendTemplate().replace(/#Receiver#/ig, $('#ctl00_ContentBody_SendMessagePanel1_lblEmailInfo')[0].children[0].innerHTML);
                $('#ctl00_ContentBody_SendMessagePanel1_tbMessage')[0].innerHTML = template;
            }
        } catch(e) {gclh_error("Improve Mail",e);}
    }

// Improve Message.
    if (settings_show_message && is_page("messagecenter")) {
        try {
            var val = "";
            var matches = document.location.href.match(/&text=(.*)/);
            if (matches && matches[1]) val = decodeUnicodeURIComponent(matches[1]);

            updateMessage(0);
            function updateMessage(waitCount) {
                if ($('textarea')[0] && $('textarea')[0].value == "" && $('#cpMsgLogHead .h5')[0].innerHTML != "") {
                    if (val == "") {
                        var rec = decode_innerHTML($('#cpMsgLogHead .h5')[0]);
                        rec = rec.replace(/^(\s*)/,'').replace(/(\s*)$/,'');
                        val = buildSendTemplate().replace(/#Receiver#/ig, rec);
                    }else{
                        var rec = decode_innerHTML($('#cpMsgLogHead .h5')[0]);
                        rec = rec.replace(/^(\s*)/,'').replace(/(\s*)$/,'');
                        val = val.replace(/#Receiver#/ig, rec);
                    }
                    $('textarea')[0].value = val;
                }
                waitCount++;
                if (waitCount <= 600) setTimeout(function(){updateMessage(waitCount);}, 100);
            }
        } catch(e) {gclh_error("Improve Message",e);}
    }

// Update Standard Message on Click of a Username in Messagecenter
    function addEventlistenerForMessageCenterNames(){
        $( "#cpConvoPanelFeed ol li" ).each(function() {
          // only add the listener once
          if(!$(this).hasClass('listeneradded')){
              $(this).addClass('listeneradded');
              $(this).click(function(){
                if(matches != null){
                    val = decodeUnicodeURIComponent(matches[1])
                }else{
                    val = buildSendTemplate();
                }
                var rec = $(this).find('.activity-header').text();
                rec = rec.replace(/^(\s*)/,'').replace(/(\s*)$/,'');
                val = val.replace(/#Receiver#/ig, rec);
                $('textarea').value = val;
              });
          }
        });
    }

    if (is_page("messagecenter")) {
        try {
            addMessageButtonListener(0);
            function addMessageButtonListener(waitCount) {
                if($( "#cpConvoPanelFeed ol li" ).length > 0){
                    $('#cpConvoPanelFeed ol').bind('DOMSubtreeModified', function(event) {
                        addEventlistenerForMessageCenterNames();
                    });
                    // Add for initial Names
                    addEventlistenerForMessageCenterNames();
                    waitCount = 700;
                }
                waitCount++;
                if (waitCount <= 600) setTimeout(function(){addMessageButtonListener(waitCount);}, 100);
            }
        } catch(e) {gclh_error("Update Standard Message on Click of a Username in Messagecenter",e);}
    }

// Improve list of pocket queries (list of PQs).
    if (document.location.href.match(/\.com\/pocket/) && document.getElementById("uxCreateNewPQ") && $('table.Table')[0]) {
        try {
            var css = "";
            // Number of Active Pocket Queries.
            if ($('#ui-id-1')[0]) $('#ui-id-1').append("&nbsp;<span title='Number of Active Pocket Queries'>("+$('#pqRepeater tbody tr:not(.TableFooter)').length+")</span>");
            // Compact layout.
            if (settings_compact_layout_list_of_pqs) {
                function lastGen(elem) {
                    elem.title = trim(elem.innerHTML);
                    elem.innerHTML = "Last Generated";
                    elem.style.whiteSpace = "nowrap";
                }
                // Header:
                css += ".pq-info-wrapper {margin: 0; padding: 10px 0 0 0; background-color: unset; box-shadow: unset;} .pq-info-wrapper p:last-child {padding: 0;}";
                css += "#Content .ui-tabs {margin-top: 3.4em;} .ui-tabs-active {box-shadow: 2px 0px 0 rgba(0,0,0,.2);} .ui-tabs .ui-tabs-nav li {margin-right: 4px;}";
                css += ".Success {margin: 5px 0 0 0;}";
                css += ".BreadcrumbWidget p {margin-top: 0;}";
                if ($('#ctl00_ContentBody_lbHeading').length > 0 && $('#divContentMain h2').length > 0) {
                    var h3 = document.createElement("h3");
                    $('#ctl00_ContentBody_lbHeading')[0].parentNode.parentNode.insertBefore(h3, $('#ctl00_ContentBody_lbHeading')[0].parentNode);
                    $('#divContentMain h3').closest('h3').append($('#ctl00_ContentBody_lbHeading').remove().get().reverse());
                    $('#divContentMain h2')[0].closest('h2').remove();
                }
                if ($('.pq-info-wrapper')[0] && $('.pq-info-wrapper')[0].children.length > 2) {
                    for (var i = 0; i <= 2; i++) {$('.pq-info-wrapper')[0].children[0].remove();}
                }
                $('#ActivePQs, #DownloadablePQs').each(function() {
                    this.setAttribute("style", "box-shadow: 2px 2px 0 rgba(0,0,0,.2);");
                    this.children[0].children[0].setAttribute("style", "font-size: .6rem; margin: -35px -15px 0 0; float: right;");
                });
                // Table active PQs:
                css += "table {margin-bottom: 0;} table.Table, table.Table th, table.Table td {padding: 5px; border: 1px solid #fff;}";
                css += "table.Table tr {line-height: 16px;} table.Table th img, table.Table td img {vertical-align: sub;}";
                if ($('#pqRepeater thead tr').length > 0 && $('#pqRepeater thead tr')[0].children.length > 12) {
                    lastGen($('#pqRepeater thead tr')[0].children[12]);
                    $('#pqRepeater thead tr th').each(function() {this.style.width = "unset";});
                }
                if ($('#pqRepeater tbody tr').length > 0 && $('#pqRepeater tbody tr')[0] && $('#pqRepeater tbody tr')[0].children.length > 0) {
                    for (var i = 0; i < $('#pqRepeater tbody tr').length; i++) {
                        if ($('#pqRepeater tbody tr')[i].className == "TableFooter") break;
                        for (var j = 0; j < $('#pqRepeater tbody tr')[0].children.length; j++) {
                            if (j != 3) $('#pqRepeater tbody tr')[i].children[j].style.whiteSpace = "nowrap";
                        }
                    }
                }
                $('#pqRepeater tbody').find('img[src*="/images/icons/16/checkbox_"]').closest('a').each(function() {
                    this.name = this.href;
                    this.href = 'javascript:void(0);';
                    this.children[0].title = '';
                    this.addEventListener('click', function() {
                        var img = '/images/icons/16/checkbox_off.png';
                        var cb = this;
                        if (cb.children[0].src.match('loader')) return;
                        if (cb.children[0].src == global_red_tick) { cb.children[0].src = img; return; }
                        cb.children[0].src = urlImages + 'ajax-loader.gif';
                        var schedulePQ = $.get(cb.name);
                        schedulePQ.done(function (result) {
                            if ($(result).find('#ActivePQs .Warning')[0]) {
                                cb.children[0].src = global_red_tick;
                                cb.children[0].title = 'Sorry, 10 Pocket Queries per day reached';
                            } else {
                                var counter = $('#pqRepeater tbody tr.TableFooter')[0].children[cb.parentNode.cellIndex-2];
                                (cb.name.match('&opt=0') ? counter.innerHTML-- : counter.innerHTML++);
                                cb.children[0].src = (cb.name.match('&opt=0') ? img : img.replace('_off', '_on'));
                                cb.name = (cb.name.match('&opt=0') ? cb.name.replace('&opt=0', '&opt=1') : cb.name.replace('&opt=1', '&opt=0'));
                            }
                        }, false);
                    });
                });
                // Table My Finds:
                css += "#ctl00_ContentBody_PQListControl1_tblMyFinds tbody tr th {border: unset;}";
                if ($('#ctl00_ContentBody_PQListControl1_tblMyFinds tbody tr').length > 1 && $('#pqRepeater thead tr')[0].children.length > 12) {
                    lastGen($('#ctl00_ContentBody_PQListControl1_tblMyFinds tbody tr')[0].children[1]);
                    var wo = ($('#pqRepeater thead tr')[0].children[12].clientWidth / $('#pqRepeater thead tr')[0].clientWidth * 100) + 0.96;
                    $('#ctl00_ContentBody_PQListControl1_tblMyFinds tbody tr')[0].children[1].style.width = wo + "%";
                    $('#ctl00_ContentBody_PQListControl1_tblMyFinds tbody tr')[1].children[0].children[1].remove();
                    $('#ctl00_ContentBody_PQListControl1_tblMyFinds tbody tr')[1].children[0].children[0].remove();
                    $('#ctl00_ContentBody_PQListControl1_tblMyFinds tbody tr')[1].children[0].children[0].style.margin = "0";
                }
                if ($('#ctl00_ContentBody_PQListControl1_btnScheduleNow').length > 0) {
                    if ($('#ctl00_ContentBody_PQListControl1_btnScheduleNow').prop("disabled")) {
                        $('#ctl00_ContentBody_PQListControl1_btnScheduleNow')[0].parentNode.parentNode.innerHTML = "<a style='opacity: 0.4; cursor: default' title='\"My Finds\" pocket query can only run once every 3 days'>Add to Queue</a>";
                    } else {
                        $('#ctl00_ContentBody_PQListControl1_btnScheduleNow')[0].parentNode.parentNode.innerHTML = "<a href='javascript:__doPostBack(\"ctl00$ContentBody$PQListControl1$btnScheduleNow\",\"\")' title='Add \"My Finds\" pocket query to Queue'>Add to Queue</a>";
                    }
                }
                // Table downloadable PQs (additional):
                if ($('#uxOfflinePQTable thead tr').length > 0) lastGen($('#uxOfflinePQTable thead tr')[0].children[5]);
                if ($('#uxOfflinePQTable tbody tr').length > 0) $('#uxOfflinePQTable tbody tr').each(function() {if (this.children[5]) this.children[5].style.whiteSpace = "nowrap";});
                if ($('#ctl00_ContentBody_PQListControl1_lbFoundGenerated').length > 0) {
                    $('#ctl00_ContentBody_PQListControl1_lbFoundGenerated')[0].innerHTML = $('#ctl00_ContentBody_PQListControl1_lbFoundGenerated')[0].innerHTML.replace(/\*/, "");
                }
                // Show both tabs (Active and Downloadable) of list of pqs on one page.
                if ($('#ActivePQs')[0] && $('#DownloadablePQs')[0]) {
                    if (settings_both_tabs_list_of_pqs_one_page) {
                        $('#ActivePQs, #DownloadablePQs').attr('aria-hidden', 'false');
                        $('#ActivePQs, #DownloadablePQs').each(function() {
                            this.style.display = 'block';
                            this.children[0].children[0].style.margin = '0px';
                        });
                        $('#DownloadablePQs')[0].style.marginTop = '10px';
                        $('#ActivePQs')[0].children[0].innerHTML = $('#ui-id-1')[0].innerHTML + $('#ActivePQs')[0].children[0].innerHTML;
                        $('#DownloadablePQs')[0].children[0].innerHTML = $('#ui-id-2')[0].innerHTML + $('#DownloadablePQs')[0].children[0].innerHTML;
                        $('ul.ui-tabs-nav')[0].remove();
                    } else {
                        if ($('#ActivePQs').attr('aria-hidden') == 'true') $('#ActivePQs')[0].style.display = 'none';
                        if ($('#DownloadablePQs').attr('aria-hidden') == 'true') $('#DownloadablePQs')[0].style.display = 'none';
                    }
                }
                // Footer:
                if ($('.pq-legend').length > 0) {
                    for (var i = 0; i <= 4; i++) {$('.pq-legend')[0].nextElementSibling.remove();}
                    $('.pq-legend')[0].remove();
                }
            }
            // "Find cache along a route" als Button.
            if ($('#uxFindCachesAlongaRoute.btn.btn-secondary').length > 0) $('#uxFindCachesAlongaRoute')[0].className = "btn btn-primary";
            // Refresh button.
            var refreshButton = document.createElement("p");
            refreshButton.innerHTML = "<a href='/pocket/default.aspx' title='Refresh Page'>Refresh Page</a>";
            if (settings_compact_layout_list_of_pqs) $('.TableFooter').each(function() {this.lastElementChild.innerHTML = refreshButton.innerHTML;});
            else document.getElementById('uxCreateNewPQ').parentNode.parentNode.parentNode.appendChild(refreshButton);
            // Highlight column of current day.
            var matches = document.getElementById('ActivePQs').childNodes[1].innerHTML.match(/([A-Za-z]*),/);
            if (matches) {
                var highlight = 0;
                switch (matches[1]) {
                    case "Sunday"   : highlight = 5; break;
                    case "Monday"   : highlight = 6; break;
                    case "Tuesday"  : highlight = 7; break;
                    case "Wednesday": highlight = 8; break;
                    case "Thursday" : highlight = 9; break;
                    case "Friday"   : highlight = 10; break;
                    case "Saturday" : highlight = 11; break;
                }
                if (highlight > 0) {
                    var trs = $('#pqRepeater tbody tr:not(.TableFooter)');
                    for (var i = 0; i < trs.length; i++) {trs[i].children[highlight].style.backgroundColor = "#ede5dc";}
                }
            }
            // Fixed header.
            if (settings_fixed_pq_header && (document.getElementById("pqRepeater") || document.getElementById("uxOfflinePQTable"))) {
              var positionPx = 0;
              if (browser === "chrome") {
                positionPx = -1; // Mitigate ugly gap for header/footer
              }
              var css = "";
              // Fixed PQ header and footer - used TH and TD selector is hack for Chrome, Edge # see on bug https://bugs.chromium.org/p/chromium/issues/detail?id=702927
              css += "#uxOfflinePQTable thead th, #pqRepeater thead th { position: -webkit-sticky; position: sticky; top: " + positionPx + "px; } ";
              css += ".PocketQueryListTable tr.TableFooter td { background-color: #E3DDC2; position: -webkit-sticky; position: sticky; bottom: " + positionPx + "px; } ";
              // Link from footer as button for better UX
              css += "#uxOfflinePQTable .TableFooter A, #pqRepeater .TableFooter A { -moz-appearance: button; -webkit-appearance: button; appearance: button; "
                  + " text-decoration: none; font: menu; color: ButtonText; display: inline-block; padding: 2px 8px; white-space: nowrap; } ";
              appendCssStyle(css);
          }
        } catch(e) {gclh_error("Improve list of PQs",e);}
    }

// Try to find values from Project-GC PQSplit
    if (document.location.href.match(/\.com\/pocket\/gcquery\.aspx/)){
        try{

            function findGetParameter(parameterName) {
                var result = null,
                    tmp = [];
                var items = location.search.substr(1).split("&");
                for (var index = 0; index < items.length; index++) {
                    tmp = items[index].split("=");
                    if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
                }
                return result;
            }

            if(findGetParameter('PQSplit')){
                // Yes we come from PQSplitter

                //Test if we already saved the PQ. If yes => close the window
                if($( "#divContentMain p.Success" ).length){

                    setTimeout(function(){
                        window.close();
                    },10);
                    return true;
                }

                $('#ctl00_ContentBody_tbName').val(findGetParameter('n'));
                $('#ctl00_ContentBody_tbResults').val(findGetParameter('c'));

                // How often should the query run
                switch(findGetParameter('ho')){
                    case "1":
                        $("#ctl00_ContentBody_rbRunOption_0").prop("checked", true);
                        break;

                    case "2":
                        $("#ctl00_ContentBody_rbRunOption_1").prop("checked", true);
                        break;

                    case "3":
                        $("#ctl00_ContentBody_rbRunOption_2").prop("checked", true);
                        break;
                }

                // Select the output Email Address
                if(findGetParameter('e') == 2){
                    // look if we have secondary email
                    if($('#ctl00_ContentBody_ddlAltEmails')){
                        $('#ctl00_ContentBody_ddlAltEmails option:eq(1)').attr('selected', 'selected');
                    }
                }

                var type = findGetParameter('t');
                var cr_name = findGetParameter('s');
                switch (type) {
                    case "region":
                        // Modifiction for Countries with "," in the name. There is a "+" after the ","
                        cr_name = cr_name.split(/,(?!\+)/);

                        if(cr_name.length >= 1){
                            for (var i = 0; i < cr_name.length; i++) {
                                cr_name[i] = cr_name[i].replace(/\+/g, " ");

                                var region = cr_name[i].substr(cr_name[i].indexOf('|')+1);

                                var state = $.grep(states_id, function(e){return e.n == region;});

                                if(state.length == 0){
                                    alert('No corresponding Region Name not found for Region: ' + region);
                                    throw Error('No corresponding Region Name not found for Region: ' + region);
                                }

                                $('#ctl00_ContentBody_rbStates').attr('checked', true);
                                $('#ctl00_ContentBody_lbStates option[value=' + state[0].id + ']').attr('selected', true);
                            }
                        }else{
                            alert('No Region Name found.');
                            throw Error('No Region Name found.');
                        }
                        break;

                    case "country":
                        // Modifiction for Countries with "," in the name. There is a "+" after the ","
                        cr_name = cr_name.split(/,(?!\+)/);
                        if(cr_name.length >= 1){
                            for (var i = 0; i < cr_name.length; i++) {
                                cr_name[i] = cr_name[i].replace(/\+/g, " ");

                                var country = $.grep(country_id, function(e){return e.n == cr_name[i];});

                                if(country.length == 0){
                                    alert('No corresponding Country Name found for Country: ' + cr_name[i]);
                                    throw Error('No corresponding Country Name found for Country: ' + cr_name[i]);
                                }

                                $('#ctl00_ContentBody_rbCountries').attr('checked', true);
                                $('#ctl00_ContentBody_lbCountries option[value=' + country[0].id + ']').attr('selected', true);
                            }
                        }else{
                            alert('No Country Name found.');
                            throw Error('No Country Name found.');
                        }
                        break;
                   default:
                        alert('Unknown Type for area. Please contact an admin of GClh.');
                        throw new Error('unknown Type: ' + type);
                }

                $('#ctl00_ContentBody_rbPlacedBetween').attr('checked', true);

                $('#ctl00_ContentBody_DateTimeBegin_Month option[value=' + findGetParameter('sm') + ']').attr('selected', true);
                $('#ctl00_ContentBody_DateTimeBegin_Day option[value=' + findGetParameter('sd') + ']').attr('selected', true);
                $('#ctl00_ContentBody_DateTimeBegin_Year option[value=' + findGetParameter('sy') + ']').attr('selected', true);

                if((findGetParameter('em') != '') && (findGetParameter('ed') != '') && (findGetParameter('ey') != '')){
                   var month = findGetParameter('em');
                   var day = findGetParameter('ed');
                   var year = findGetParameter('ey');
                }else{
                    var month = 12;
                    var day = 31;
                    var year = (new Date()).getFullYear()+1;
                }

                $('#ctl00_ContentBody_DateTimeEnd_Month option[value=' + month + ']').attr('selected', true);
                $('#ctl00_ContentBody_DateTimeEnd_Day option[value=' + day + ']').attr('selected', true);
                $('#ctl00_ContentBody_DateTimeEnd_Year option[value=' + year + ']').attr('selected', true);

                // All values are set, submit the form
                document.getElementById('ctl00_ContentBody_btnSubmit').click();
            }
        } catch(e) {gclh_error("Create Automated PQs from project-gc PQ splitter",e);}
    }

// Show Log It button.
    if (settings_show_log_it && document.location.href.match(/\.com\/(seek\/nearest\.aspx\?|my\/recentlyviewedcaches\.aspx)/)) {
        try {
            var links = document.getElementsByTagName("a");
            for (var i = 0; i < links.length; i++) {
                if (links[i].href.match(/^https?:\/\/www\.geocaching\.com\/seek\/cache_details\.aspx\?.*/) && links[i].innerHTML.match(/^<span>/)) {
                    links[i].parentNode.innerHTML = links[i].parentNode.innerHTML.replace("<br>", "<a title='Log it' href='" + links[i].href.replace("cache_details", "log") + "'><img src='/images/stockholm/16x16/add_comment.gif'></a><br>");
                } else if (links[i].href.match(/^https?:\/\/www\.geocaching\.com\/geocache\/.*/) && links[i].innerHTML.match(/^<span>/)) {
                    var match = links[i].href.match(/^https?:\/\/www\.geocaching\.com\/geocache\/([^_]*)/);
                    links[i].parentNode.innerHTML = links[i].parentNode.innerHTML.replace("<br>", "<a title='Log it' href='/seek/log.aspx?wp=" + match[1] + "'><img src='/images/stockholm/16x16/add_comment.gif'></a><br>");
                }
            }
        } catch(e) {gclh_error("Show Log It button",e);}
    }

// Improve pocket queries, nearest lists, recently viewed. Compact layout, favorites percentage.
    if (settings_compact_layout_pqs && document.location.href.match(/\.com\/seek\/nearest\.aspx\?pq=/)) var li0 = "p";
    else if (settings_compact_layout_nearest && document.location.href.match(/\.com\/seek\/nearest\.aspx\?/)) var li0 = "n";
    else if (settings_compact_layout_recviewed && document.location.href.match(/\.com\/my\/recentlyviewedcaches\.aspx/)) var li0 = "r";
    if (li0) {
        try {
            var css = "";
            // Compact layout:
            // Header.
            css += ".InformationWidget ul#UtilityNav li {padding: 6px 0 0 0;} .InformationWidget ul#UtilityNav li a {padding: 0; border: none; margin: 0 0 0 5px;}";
            css += ".InformationWidget {margin: 0; line-height: 1em;} .left {margin: 0; padding: 4px 0;}";
            css += "#ctl00_ContentBody_LocationPanel1_OriginLabel span {font-weight: bold; color: #594a42; font-size: 1em; margin-right: 10px;}";
            css += "#ctl00_ContentBody_LocationPanel1_OriginLabel a {margin-right: 5px;}";
            css += "#ctl00_ContentBody_ResultsPanel > div:nth-child(1) {margin: 0 !important; padding: 4px 0;}";  // GC Tour
            var h3 = document.createElement("h3");
            h3.setAttribute("style", "padding-bottom: 8px");
            if ($('#ctl00_ContentBody_SearchResultText').length > 0 && $('#divContentMain h2').length > 0) {
                $('#ctl00_ContentBody_SearchResultText')[0].parentNode.parentNode.insertBefore(h3, $('#ctl00_ContentBody_SearchResultText')[0].parentNode);
                $('#divContentMain h3').closest('h3').append($('#ctl00_ContentBody_SearchResultText').remove().get().reverse());
                $('#divContentMain h2')[0].closest('h2').remove();
            }
            if (document.location.href.match(/recentlyviewed/) && $('.BottomSpacing')[0] && $('.BreadcrumbWidget')[0]) {
                css += ".TopSpacing, .TopSpacing p {margin-top: 4px; margin-bottom: 4px;} hr {margin-bottom: 15px;}";
                h3.innerHTML = $('.BottomSpacing')[0].innerHTML;
                $('.BottomSpacing')[0].parentNode.insertBefore(h3, $('.BottomSpacing')[0]);
                $('.BottomSpacing')[0].remove();
                $('.BreadcrumbWidget')[0].remove();
            }
            if ($('#ctl00_ContentBody_LocationPanel1_OriginLabel').length > 0) {
                var span = document.createElement("span");
                span.innerHTML = $('#ctl00_ContentBody_LocationPanel1_OriginLabel')[0].childNodes[0].data;
                if ($('#ctl00_ContentBody_LocationPanel1_OriginLabel')[0].children.length > 0) {
                    $('#ctl00_ContentBody_LocationPanel1_OriginLabel')[0].children[0].parentNode.insertBefore(span, $('#ctl00_ContentBody_LocationPanel1_OriginLabel')[0].children[0]);
                } else $('#ctl00_ContentBody_LocationPanel1_OriginLabel')[0].appendChild(span);
                $('#ctl00_ContentBody_LocationPanel1_OriginLabel')[0].childNodes[0].remove();
            }
            // Table.
            css += "table {margin-bottom: 0;} table.Table th, table.Table td {padding: 5px; border: 1px solid #fff; width: unset !important;}";
            css += "table.Table th, table.Table td:not(.Merge) {white-space: nowrap;} table.Table td.Merge {padding: 3px 5px;}";
            css += "table.Table tr {line-height: 14px;} table.Table img {vertical-align: sub;} table.Table .IconButton {display: unset; padding: 0;}";
            css += ".SearchResultsWptType {width: 24px; height: 24px;} .small {line-height: unset; margin-bottom: unset;}";
            css += ".gclh_empty {overflow: hidden; max-width: 9px;} .gclh_hideit {overflow: hidden; text-overflow: ellipsis; display: -moz-box;}";
            if (document.location.href.match(/recentlyviewed/)) {
                css += "table.Table tr:nth-child(1) {line-height: 19px;} .Success {background-color: #fff; color: #54b948 !important;}";
            }
            function newHeadcell(tr0, ch, desc) {
                var th = document.createElement("th");
                th.appendChild(document.createTextNode(desc));
                if (tr0.children[ch]) tr0.children[ch].parentNode.insertBefore(th, tr0.children[ch]);
                else tr0.appendChild(th);
            }
            if ($('table.SearchResultsTable tbody tr')[0] && $('table.SearchResultsTable tbody tr')[0].children.length > 8) {
                var tr0 = $('table.SearchResultsTable tbody tr')[0];
                newHeadcell(tr0, 9, "Y. Found");
                tr0.children[9].title = "Your Found";
                tr0.children[9].setAttribute("class", "gclh_empty");
                tr0.children[8].children[0].title = tr0.children[8].children[0].innerHTML;
                tr0.children[8].children[0].innerHTML = "Found";
                if (!document.location.href.match(/recentlyviewed/)) {
                    newHeadcell(tr0, 7, "Size");
                    tr0.children[7].setAttribute("class", "AlignCenter");
                }
                for (var i = 0; i <= 4; i += 2) {tr0.children[6].childNodes[i].data = tr0.children[6].childNodes[i].data.replace(/(\(|\))/g, "");}
                tr0.children[6].setAttribute("class", "AlignCenter");
            }
            function newContentcell(trDataNew, chil, content, clas, obj) {
                var td = document.createElement("td");
                if (obj) td.appendChild(content);
                else td.appendChild(document.createTextNode(content));
                td.setAttribute("class", clas);
                if (trDataNew.children[chil]) trDataNew.children[chil].parentNode.insertBefore(td, trDataNew.children[chil]);
                else trDataNew.appendChild(td);
            }
            if ($('table.SearchResultsTable tbody tr.Data').length > 0) {
                $('table.SearchResultsTable tbody tr.Data td:not(.Merge)').each(function() {
                    if (this.innerHTML.match(/<br>/i)) this.innerHTML = this.innerHTML.replace(/<br>/ig," ");
                });
                var trData = $('table.SearchResultsTable tbody tr.Data');
                for (var i = 0; i < trData.length; i++) {
                    // Last Found and new column Your Found.
                    if (trData[i].children[9].children[0].children[0] && trData[i].children[9].children[0].children[0].id.match("_uxUserLogDate")) {
                        newContentcell(trData[i], 10, trData[i].children[9].children[0].children[0], "small", true);
                    } else if (trData[i].children[9].children[0].children[1] && trData[i].children[9].children[0].children[1].id.match("_uxUserLogDate")) {
                        newContentcell(trData[i], 10, trData[i].children[9].children[0].children[1], "small", true);
                    } else newContentcell(trData[i], 10, "", "small", false);
                    // D/T and new column Size.
                    if (!document.location.href.match(/recentlyviewed/)) {
                        trData[i].children[7].childNodes[4].remove();
                        trData[i].children[7].childNodes[2].remove();
                        newContentcell(trData[i], 8, trData[i].children[7].children[1], "", true);
                        trData[i].children[8].children[0].setAttribute("style", "vertical-align: bottom;");
                    }
                    // Description.
                    trData[i].children[5].children[(settings_show_log_it ? 3:2)].setAttribute("class", "small gclh_hideit");
                    trData[i].children[5].children[(settings_show_log_it ? 3:2)].title = trData[i].children[5].children[(settings_show_log_it ? 3:2)].innerHTML.replace(/(\s{2,})/g, " ").replace(/^\s/, "");
                }
            }
            // Footer.
            css += "#ctl00_ContentBody_ResultsPanel > div:nth-child(5) {margin: 0 !important; padding: 4px 0;}";  // GC Tour
            css += ".span-10 {width: 100% !important;}";
            if ($('#ctl00_ContentBody_chkHighlightBeginnerCaches').length > 0 && $('#Download').length > 0 && $('#chkAll').length > 0) {
                $('#ctl00_ContentBody_chkHighlightBeginnerCaches')[0].parentNode.parentNode.parentNode.insertBefore($('#chkAll')[0].parentNode, $('#ctl00_ContentBody_chkHighlightBeginnerCaches')[0].parentNode.parentNode);
                $('#chkAll')[0].parentNode.appendChild($('#Download')[0]);
                $('#Download')[0].parentNode.className = "gclh_last_line";
                while ($('.gclh_last_line')[0].nextElementSibling) {$('.gclh_last_line')[0].nextElementSibling.remove();}
            }
            if ($('#ctl00_ContentBody_KeyPanel').length > 0) {
                while ($('#ctl00_ContentBody_KeyPanel')[0].nextElementSibling) {$('#ctl00_ContentBody_KeyPanel')[0].nextElementSibling.remove();}
                $('#ctl00_ContentBody_KeyPanel')[0].remove();
            }
            // Favorites percentage:
            if ((settings_fav_proz_pqs && li0 == "p") || (settings_fav_proz_nearest && li0 == "n") || (settings_fav_proz_recviewed && li0 == "r")) {
                var url = (li0 == "r" ? "recentlyviewedcaches.aspx/FavoriteScore" : "nearest.aspx/FavoriteScore");
                css += "span.favorite-rank, .gclh_favPerc {font-size: .85em; float: right;}";
                $('#ctl00_ContentBody_dlResults_ctl00_uxSort_Favorites, #ctl00_ContentBody_RecentlyViewedCachesList1_dlDetailResults_ctl00_uxSort_Favorites').closest('th').after('<th class="AlignCenter" title="Favorites percentage">%</th>');
                $('a.favoriteTotal').each(function() {
                    var fav = $(this);
                    fav[0].children[0].title = "Favorites";
                    fav.closest('td').after('<td class="AlignRight gclh_favPerc" title="Favorites percentage"></td>');
                    $.ajax({
                        url: url,
                        type: 'POST',
                        contentType: "application/json; charset=utf-8",
                        data: JSON.stringify({ dto: { data: fav.data("id"), ut: 2, p: $(fav.children().get(0)).html() } }),
                        dataType: 'json',
                        success: function (result) {
                            fav[0].closest('td').nextElementSibling.innerHTML = (result.d.score ? (result.d.score > 100 ? 100 : result.d.score) : 0);
                        }
                    });
                });
            }
            appendCssStyle(css);
        } catch(e) {gclh_error("Improve PQs ...",e);}
    }

// Pocket query set default value for new one, set warning message.
    if (document.location.href.match(/\.com\/pocket\/gcquery\.aspx/)) {
        try {
            var idCB = "#ctl00_ContentBody_";
            var idOp = "#ctl00_ContentBody_cbOptions_";
            var idDa = "#ctl00_ContentBody_cbDays_";
            if (($("p.Success").length <= 0) && (document.location.href.match(/\.com\/pocket\/gcquery\.aspx$/) || document.location.href.match(/\.com\/pocket\/gcquery\.aspx\?ll=/))) {
                if (settings_pq_set_cachestotal) $(idCB+"tbResults").val(settings_pq_cachestotal);
                if (settings_pq_option_ihaventfound) {
                    $(idOp+"0").prop('checked', true);
                    $(idOp+"1").prop('checked', false);
                }
                if (settings_pq_option_idontown) {
                    $(idOp+"2").prop('checked', true);
                    $(idOp+"3").prop('checked', false);
                }
                if (settings_pq_option_ignorelist) $(idOp+"6").prop('checked', true);
                if (settings_pq_option_isenabled) {
                    $(idOp+"13").prop('checked', true);
                    $(idOp+"12").prop('checked', false);
                }
                if (settings_pq_option_filename) $(idCB+"cbIncludePQNameInFileName").prop('checked', true);
                if (settings_pq_set_difficulty) {
                    $(idCB+"cbDifficulty").prop('checked', true);
                    $(idCB+"ddDifficulty").val(settings_pq_difficulty);
                    $(idCB+"ddDifficultyScore").val(settings_pq_difficulty_score);
                }
                if (settings_pq_set_terrain) {
                    $(idCB+"cbTerrain").prop('checked', true);
                    $(idCB+"ddTerrain").val(settings_pq_terrain);
                    $(idCB+"ddTerrainScore").val(settings_pq_terrain_score);
                }
                if (settings_pq_automatically_day) {
                    var time = $(idCB+'QueryPanel legend').first().text();
                    if (time.match(/.*Sunday.*/))         $(idDa+"0").prop('checked', true);
                    else if (time.match(/.*Monday.*/))    $(idDa+"1").prop('checked', true);
                    else if (time.match(/.*Tuesday.*/))   $(idDa+"2").prop('checked', true);
                    else if (time.match(/.*Wednesday.*/)) $(idDa+"3").prop('checked', true);
                    else if (time.match(/.*Thursday.*/))  $(idDa+"4").prop('checked', true);
                    else if (time.match(/.*Friday.*/))    $(idDa+"5").prop('checked', true);
                    else if (time.match(/.*Saturday.*/))  $(idDa+"6").prop('checked', true);
                }
            }
            if (settings_pq_warning) {
                $(idCB+"cbOptions").after("<div id='warning' style='display: none; border: 1px solid #dfdf80; background-color: #ffffa5; padding: 10px;'><div style='float: left'><img src='/play/app/ui-icons/icons/global/attention.svg'></div><div>&nbsp;&nbsp;One or more options are in conflict and creates an empty result set. Please change your selection.</div></div>");
                for (var i=0; i<=13; i++) {$(idOp+i).change(verifyPqOpt);}
                verifyPqOpt();
            }
        } catch(e) {gclh_error("Pocket query set defaults, set warning",e);}
    }
    // Marks two PQ options, which are in rejection.
    function markOptInRej(opt1, opt2) {
        var st = "ctl00_ContentBody_cbOptions_";
        if ($("#"+st+opt1).is(':checked') && $("#"+st+opt2).is(':checked')) {
            $("label[for='"+st+opt1+"'], label[for='"+st+opt2+"']").css('background-color','#ffff00');
            $("label[for='"+st+opt1+"'], label[for='"+st+opt2+"']").css('color','#ff0000');
            return true;
        } else {
            $("label[for='"+st+opt1+"'], label[for='"+st+opt2+"']").css('background-color','#ffffff');
            $("label[for='"+st+opt1+"'], label[for='"+st+opt2+"']").css('color','#000000');
            return false;
        }
    }
    // Find PQ options, which are in rejection.
    function verifyPqOpt() {
        var status = false;
        status = status | markOptInRej("0", "1");  // I haven't found / I have found
        status = status | markOptInRej("2", "3");  // I don't vs. own I own
        status = status | markOptInRej("4", "5");  // Are available to all users vs. Are for members only
        status = status | markOptInRej("8", "9");  // Found in the last 7 days vs. Have not been found
        status = status | markOptInRej("12", "13");  // Is Disabled vs. is Enabled
        if (status) $("#warning").show();
        else $("#warning").hide();
    }

// Map on create pocket query page.
    if (settings_pq_previewmap && document.location.href.match(/\.com\/pocket\/gcquery\.aspx/)) {
        try {
            leafletInit();

            $('.LatLongTable').after('<div style="position:absolute;top: 8px; left: 300px;height:330px;width:470px;" id="gclh_map" ></div>').parent().css("style", "relative");

            var previewMap = L.map('gclh_map', {
                  dragging: false,
                  zoomControl: true,
            }).setView([0, 0],0); // to avoid problems;

            var layer = ( settings_pq_previewmap_layer == "" || settings_pq_previewmap_layer == "Geocaching" ) ? all_map_layers['OpenStreetMap Default'] : all_map_layers[settings_pq_previewmap_layer];
            var layerObj = L.tileLayer( layer.tileUrl, layer ).addTo(previewMap);

            // delayed load of Groudspeaks map layer (we need an access token)
            if ( settings_pq_previewmap_layer == "Geocaching" ) {
                gclh_GetGcAccessToken( function(r) {
                    all_map_layers["Geocaching"].accessToken = r.access_token;

                    var layer = all_map_layers['Geocaching'];
                    L.tileLayer( layer.tileUrl, layer ).addTo(previewMap);

                    previewMap.eachLayer(function (layer) {
                        if ( layerObj == layer ) previewMap.removeLayer(layer);
                    });
                });
            }

            var marker = L.marker([0, 0],{icon: L.icon({
                iconUrl: map_marker,
                shadowUrl: map_marker_shadow,
                iconSize:     [25, 41], // size of the icon
                shadowSize:   [41, 41], // size of the shadow
                iconAnchor:   [11, 41], // point of the icon which will correspond to marker's location
                shadowAnchor: [11, 41],  // the same for the shadow
            })}).addTo(previewMap);

            var radius = L.circle( [0,0], 0 ).addTo(previewMap);

            var group = new L.featureGroup([marker, radius]);

            $('#ctl00_ContentBody_rbOriginNone').closest('fieldset')[0].id = "gclh_Origin";
            $('.LatLongTable input, #gclh_Origin, #ctl00_ContentBody_tbRadius, #ctl00_ContentBody_rbUnitType_0, #ctl00_ContentBody_rbUnitType_1').change(function() {
                var coordType = document.getElementsByName("ctl00$ContentBody$LatLong")[0].value;
                var northField = $('#ctl00_ContentBody_LatLong\\:_selectNorthSouth')[0];
                var northSouth = $(northField.options[northField.selectedIndex]).text().replace('.', '');
                var westField = $('#ctl00_ContentBody_LatLong\\:_selectEastWest')[0];
                var westEast = $(westField.options[westField.selectedIndex]).text().replace('.', '');
                var lat = "";
                var lng = "";
                switch (coordType) {
                    case "2":  //DMS
                        lat = northSouth + " " + $('#ctl00_ContentBody_LatLong__inputLatDegs')[0].value + " " + $('#ctl00_ContentBody_LatLong__inputLatMins')[0].value + ' ' + $('#ctl00_ContentBody_LatLong__inputLatSecs')[0].value;
                        lng = westEast + " " + $('#ctl00_ContentBody_LatLong__inputLongDegs')[0].value + " " + $('#ctl00_ContentBody_LatLong__inputLongMins')[0].value + ' ' + $('#ctl00_ContentBody_LatLong__inputLongSecs')[0].value;
                        var converted = toDec(lat + " " + lng);
                        lat = converted[0];
                        lng = converted[1];
                        break;
                    case "1":  //MinDec
                        lat = northSouth + " " + $('#ctl00_ContentBody_LatLong__inputLatDegs')[0].value + " " + $('#ctl00_ContentBody_LatLong__inputLatMins')[0].value;
                        lng = westEast + " " + $('#ctl00_ContentBody_LatLong__inputLongDegs')[0].value + " " + $('#ctl00_ContentBody_LatLong__inputLongMins')[0].value;
                        var converted = toDec(lat + " " + lng);
                        lat = converted[0];
                        lng = converted[1];
                        break;
                    case "0":  //DegDec
                        lat = (northSouth == "S" ? "-" : "") + $('#ctl00_ContentBody_LatLong__inputLatDegs')[0].value;
                        lng = (westEast == "W" ? "-" : "") + $('#ctl00_ContentBody_LatLong__inputLongDegs')[0].value;
                        break;
                }
                if (!$('#ctl00_ContentBody_rbOriginWpt')[0].checked) {
                    lat = lng = "";
                    $('#gclh_map').hide();
                } else {
                    $('#gclh_map').show();
                    previewMap.setView([lat, lng]);
                    marker.setLatLng([lat, lng]);
                    radius.setLatLng([lat, lng]);

                    var factor = (($("input[name='ctl00$ContentBody$rbUnitType']:checked").val() == "mi")?1609:1000);
                    radius.setRadius(parseInt($("#ctl00_ContentBody_tbRadius").val())*factor);

                    previewMap.fitBounds(group.getBounds(), { padding: [20, 20] });
                }
            });
            $('.LatLongTable input').change();
        } catch(e) {gclh_error("Map on create pocket query page",e);}
    }

// Name for PQ from bookmark.
    if ((document.location.href.match(/\.com\/pocket\/bmquery\.aspx/)) && $('#ctl00_ContentBody_lnkListName')[0]) {
        try {
            if ($('#ctl00_ContentBody_tbName')[0].value == "") $('#ctl00_ContentBody_tbName')[0].value = $('#ctl00_ContentBody_lnkListName')[0].innerHTML;
            $('#ctl00_ContentBody_cbIncludePQNameInFileName')[0].checked = true;
        } catch(e) {gclh_error("Name for PQ from bookmark",e);}
    }

// Improve new lists page with my lists, bookmark lists, favorites list and ignore list.
    if (is_page('lists')) {
        try {
            // Set lines in color for user and in zebra.
            // Set correct number of columns in longtext. BMLs and Ignore List.
            function setLinesInColorAndCorrectColspan(waitCount) {
                if ($('.rt-table .rt-tbody .rt-tr')[0] || ($('.geocache-table tbody tr')[0])) {
                    var lines = $('.rt-table .rt-tbody .rt-tr, .geocache-table tbody tr');
                    if (lines && $('.geocache-table tbody tr')[0]) {
                        if (settings_show_common_lists_color_user && $('.list-details')[0]) {
                            setLinesColorUser('settings_show_common_lists_color', 'user', lines, 1, '', 'new');
                        }
                        var numberOfColumns = $(lines[0]).find($('td')).length - 1;
                        $('.geocache-table tbody tr td.cache-description').each(function() {
                            $(this).attr('colspan', numberOfColumns);
                        });
                    }
                    if (lines && settings_show_common_lists_in_zebra) {
                        setLinesColorInZebra(settings_show_common_lists_in_zebra, lines, 1);
                    }
                } else {waitCount++; if (waitCount <= 50) setTimeout(function(){setLinesInColorAndCorrectColspan(waitCount);}, 200);}
            }

            // Improve layout.
            function improveLayoutHead(waitCount) {
                if ($('.rt-table .rt-thead .rt-tr')[0] || $('.geocache-table thead tr')[0]) {
                    if ($('.gclh_improveLayoutHead')[0]) return;
                    var css = '';
                    // Compact layout.
                    if (settings_lists_compact_layout) {
                        // BML: Disable back button.
                        css += '.breadcrumb {display: none;}';
                        // BML: Set icon edit description upwards.
                        if ($('.edit-description')[0] && $('.structure header h1')[0]) {
                            $('.structure header h1 span').before($('.edit-description:first').remove().get().reverse());
                            css += '.edit-description {margin-left: 12px; margin-right: 4px;}';
                        }
                        // BML: Disable "Add a description about your List".
                        css += '.list-description.faded {display: none;}';
                        // BML: Disable ratings if no ratings available.
                        if ($('.list-details-ratings .no-list-ratings')[0]) {
                            css += '.list-details-ratings {display: none;}';
                        }
                        // FAVORITES: Disable description.
                        if ($('header.section-header')[0]) {
                            css += '.section-description {display: none;}';
                        }
                        // IGNORE: Disable description.
                        if ($('header.ignore-header')[0]) {
                            css += '.list-description {display: none !important;}';
                        }
                        // Description BMLs, distance.
                        if (!$('.gc-button-group')[0]) {
                            css += '.list-description {margin-bottom: 6px !important;}';
                        }
                        // Gray bar, distance and size.
                        css += '.section-controls {height: 40px; margin-top: 8px; margin-bottom: 8px; padding: 0 6px;}';
                        css += '.section-controls .page-size-controls {margin-right: 0px;}';
                        css += '.section-controls .pagination-controls {padding-left: 10px;}';
                        css += '.pagination-controls .pagination-control {height: 24px; width: 24px;}';
                        css += '.pagination-controls .pagination-control svg {height: 20px; width: 20px;}';
                        css += '.gc-labeled-select .gc-select select {padding: 6px 12px;}';
                        css += '.gc-labeled-select .gc-select select + svg {top: 8px;}';
                        // Owner BMLs, distance.
                        css += '.list-meta .byline {margin: 8px 0px;}';
                        // Multiselect action bar, distance and size.
                        css += '.multi-select-action-bar {padding: 5px;}';
                        css += '.multi-select-action-bar .multi-select-action-bar-count-section {padding-left: 0px;}';
                        css += '.gc-button.gc-button-has-type {line-height: 1.15; padding: 8px;}';
                        css += 'button.multi-select-action-bar-button:nth-child(2) {border-bottom-width: 2px; padding-bottom: 5px; padding-top: 5px; margin-right: 5px;}';
                        css += '#multi-select-action-bar-add-button {padding-top: 5px; padding-bottom: 5px;}';
                        // Button list of BMLs, size.
                        css += '.list-hub button.gc-button:nth-child(2) {padding-top: 1px; padding-bottom: 1px;}';
                        css += '.list-hub .section-header svg {width: 20px;}';
                        // Überschriften.
                        css += '.geocache-table thead th.header-multiselect {width: 42px !important;}';
                        css += '.geocache-table thead th {padding: 8px 4px !important; width: unset !important;}';
                        css += '.geocache-table .header-geocache-name {padding-left: 50px !important;}';
                        // My Lists, header, distance.
                        css += '.rt-thead .rt-tr {padding-left: 7px;}';
                        // My Lists, header progress bar, distance and size.
                        css += '.rt-thead .rt-th.list-progress-header {margin-left: 30px;}';
                        css += '.rt-thead .rt-th.list-status-header {margin-left: 20px;}';
                        // Listname and visibility, size.
                        css += '.structure header h1 {font-size: 21px;}';
                        css += '.structure header .visibility-tag {font-size: 16px;}';
                    }
                    // Disable "Back to top" button.
                    if (settings_lists_back_to_top) {
                        css += '.scroll-to-top {display: none;}';
                    }
                    if (!css == '') appendCssStyle(css);
                    if ($('table')[0]) $('table').addClass('gclh_improveLayoutHead');
                    if ($('.rt-table')[0]) $('.rt-table').addClass('gclh_improveLayoutHead');
                } else {waitCount++; if (waitCount <= 200) setTimeout(function(){improveLayoutHead(waitCount);}, 50);}
            }
            function improveLayoutBody(waitCount) {
                if ($('.rt-table .rt-tbody .rt-tr')[0] || $('.geocache-table tbody tr')[0]) {
                    var css = '';
                    // Compact layout.
                    if (settings_lists_compact_layout) {
                        // Column distance.
                        css += '.geocache-table tbody td {padding: 4px 4px;}';
                        // Column width.
                        css += '.geocache-table tbody td.cell-multiselect {width: 42px !important;}';
                        // Cache icon size.
                        css += '.geocache-type-icon {height: 35px !important; min-width: 35px !important; width: 35px !important; vertical-align: middle;}';
                        // GC name.
                        css += '.geocache-table .cell-geocache-name {align-items: unset;}';
                        // GC name and GC code distance.
                        css += '.geocache-name {margin-bottom: 0px !important; margin-top: 0px;}';
                        // Edit button size.
                        css += '.edit-geocache-button {height: 35px; width: 35px;}';
                        // Do not break column distance.
                        css += '.geocache-distance-display {white-space: nowrap;}';
                        // Do not break column location.
                        css += '.cell-geocache-location {white-space: nowrap;}';
                        // On the favorites a flex element is missing. That is the reason because the lines are so high.
                        css += '.geocache-table .cell-geocache-name {display: flex;}';
                        // My Lists, lines list name, size.
                        css += '.rt-tbody .list-name {font-size: 14px; font-weight: bold;}';
                        // My Lists, lines, distance.
                        css += '.rt-tbody .rt-tr {padding-left: 12px;}';
                        // My Lists, lines progress bar, distance and size.
                        css += '.rt-tbody .rt-tr {height: 40px;}';
                        css += '.rt-tbody .gc-progress-bar .meta {margin-top: 0px; position: absolute; top: 10px; margin-left: 155px; width: 72px; text-align: center;}';
                        css += '.rt-tbody .rt-td.list-status {margin-left: 50px;}';
                        // Show number of bookmark lists.
                        if ($('.rt-tbody .rt-tr')[0] && $('.structure header h1')[0] && $('.structure header h1')[0].childNodes[0]) {
                            if (!$('.gclh_number_of_lines')[0]) {
                                var span = document.createElement('span');
                                span.setAttribute('class', 'gclh_number_of_lines');
                                span.setAttribute('title', 'Number of lists');
                                $('.structure header h1')[0].childNodes[0].after(span);
                            }
                            $('.gclh_number_of_lines')[0].innerHTML = ' (' + $('.rt-tbody .rt-tr').length + ')';
                        }
                        // Indent of longtext until cache name on BMLs and Ignore List.
                        if ($('.list-details')[0]) {
                            css += '.cache-description {padding-left: 51px !important;}';
                        }
                    }
                    // Improve disabled caches.
                    if (settings_lists_disabled) {
                        var items = $('.geocache-details .geocache-status.disabled').closest('.geocache-details');
                        if (items) {
                            for (var i = 0; i < items.length; i++) {
                                if ($(items[i]).find($('.geocache-name'))[0]) {
                                    if (!$(items[i]).find($('.geocache-name')).hasClass('disabled')) {
                                        $(items[i]).find($('.geocache-name')).addClass('disabled');
                                    }
                                    if (!$(items[i]).find($('.geocache-name'))[0].getAttribute('title') == 'disabled') {
                                        $(items[i]).find($('.geocache-name'))[0].setAttribute('title', 'disabled');
                                    }
                                }
                            }
                        }
                        css += '.geocache-name.disabled a {color: #' + settings_lists_disabled_color + ';}';
                        css += '.geocache-name.disabled a {text-decoration: ' + (settings_lists_disabled_strikethrough == true ? "line-through" : "none") + '}';
                    }
                    // Improve archived caches.
                    if (settings_lists_archived) {
                        var items = $('.geocache-details .geocache-status.archived').closest('.geocache-details');
                        if (items) {
                            for (var i = 0; i < items.length; i++) {
                                if ($(items[i]).find($('.geocache-name'))[0]) {
                                    if (!$(items[i]).find($('.geocache-name')).hasClass('archived')) {
                                        $(items[i]).find($('.geocache-name')).addClass('archived');
                                    }
                                    if (!$(items[i]).find($('.geocache-name'))[0].getAttribute('title') == 'archived') {
                                        $(items[i]).find($('.geocache-name'))[0].setAttribute('title', 'archived');
                                    }
                                }
                            }
                        }
                        css += '.geocache-name.archived a {color: #' + settings_lists_archived_color + ';}';
                        css += '.geocache-name.archived a {text-decoration: ' + (settings_lists_archived_strikethrough == true ? "line-through" : "none") + '}';
                    }
                    // Set premium identifier in own column.
                    if (settings_lists_premium_column) {
                        if (!$('.header-premium-gclh')[0]) {
                            $('table thead th.header-geocache-name').after('<th class="header-premium-gclh" title="Premium Member Only Cache">PMO</th>');
                        }
                        $('table tbody tr').each(function() {
                            if (!$(this).find('.cell-premium-gclh')[0]) {
                                if ($(this).find('.cell-geocache-name .geocache-status')[0] && $(this).find('.cell-geocache-name .geocache-status')[0].innerHTML.match(/premium/i)) {
                                    $(this).find('.cell-geocache-name').after('<td class="cell-premium-gclh"><img src="/images/icons/16/premium_only.png" title="Premium Member Only Cache"></td>');
                                } else $(this).find('.cell-geocache-name').after('<td class="cell-premium-gclh"></td>');
                            }
                        });
                        css += '.cell-premium-gclh img {vertical-align: sub;}';
                        css += '.header-premium-gclh {cursor: default;}';
                    }
                    // Hide cache status line.
                    if (settings_lists_disabled && settings_lists_archived && settings_lists_premium_column) {
                        css += '.geocache-status {display: none;}';
                    }
                    // Set found identifier in own column on BMLs.
                    if (settings_lists_found_column_bml && !$('.gc-button-group')[0]) {
                        if (!$('.header-found-gclh')[0]) {
                            $('table thead th.header-geocache-name').after('<th class="header-found-gclh" title="Found Geocache">Found</th>');
                        }
                        $('table tbody tr').each(function() {
                            if (!$(this).find('.cell-found-gclh')[0]) {
                                if ($(this).find('.cell-geocache-name svg.log-status use')[0] && $(this).find('.cell-geocache-name svg.log-status use').attr('xlink:href')[0] && $(this).find('.cell-geocache-name svg.log-status use').attr('xlink:href').match(/smiley/i)) {
                                    $(this).find('.cell-geocache-name').after('<td class="cell-found-gclh" title="Found Geocache"><svg class="found-gclh"><use xlink:href="#smiley"></svg></td>');
                                } else $(this).find('.cell-geocache-name').after('<td class="cell-found-gclh"></td>');
                            }
                        });
                        css += '.found-gclh {height: 16px; width: 16px; vertical-align: sub;}';
                        css += '.header-found-gclh {cursor: default;}';
                    }
                    // Show GClh "Log it" icon on BMLs.
                    if (settings_lists_show_log_it && !$('.gc-button-group')[0]) {
                        $('table tbody tr .geocache-details').each(function() {
                            if (!$(this).find('.gclh_log_it')[0]) {
                                var gccode = $(this).find('.geocache-code')[0].innerHTML.match(/\|\s(.*)$/);
                                if (gccode && gccode[1]) {
                                    $(this).find('.geocache-name a').after(' <a class="gclh_log_it" title="Log it" href="/seek/log.aspx?wp=' + gccode[1] + '"><img src="/images/stockholm/16x16/add_comment.gif"></a>');
                                }
                            }
                        });
                        css += '.gclh_log_it img {vertical-align: top;}';
                    }
                    // Set cache type icons visible.
                    if (settings_lists_icons_visible) {
                        if (settings_lists_cache_type_icons_visible) setIconsVisible('svg.geocache-type-icon use', true);
                        else setIconsVisible('svg.geocache-type-icon use', false);
                    }
                    // Set log status icons visible.
                    if (settings_lists_icons_visible) {
                        if (settings_lists_log_status_icons_visible) setIconsVisible('svg.log-status use', true);
                        else setIconsVisible('svg.log-status use', false);
                    }
                    function setIconsVisible(pfad, visible) {
                        var items = $('.list-item-details');
                        if (items) {
                            for (var i = 0; i < items.length; i++) {
                                if ($(items[i]).find('.geocache-status.archived, .geocache-status.disabled')[0]) {
                                    var attrib = $(items[i]).find(pfad)[0].getAttribute('xlink:href');
                                    if (visible == true) {
                                        if (attrib && attrib.match(/#(.*)_disabled/)) {
                                            $(items[i]).find(pfad)[0].setAttribute('xlink:href', attrib.replace('_disabled', ''));
                                        }
                                    } else {
                                        if (attrib && !attrib.match(/#(.*)_disabled/)) {
                                            $(items[i]).find(pfad)[0].setAttribute('xlink:href', attrib + '_disabled');
                                        }
                                    }
                                }
                            }
                        }
                    }
                    setLinesInColorAndCorrectColspan(0);
                    if (!$('.gclh_improveLayoutBody')[0] && !css == '') appendCssStyle(css);
                    if ($('table')[0] && !$('table').hasClass('gclh_improveLayoutBody')) $('table').addClass('gclh_improveLayoutBody');
                    if ($('.rt-table')[0] && !$('table').hasClass('gclh_improveLayoutBody')) $('.rt-table').addClass('gclh_improveLayoutBody');
                } else {waitCount++; if (waitCount <= 200) setTimeout(function(){improveLayoutBody(waitCount);}, 50);}
            }

            // Processing all steps.
            function processAll() {
                improveLayoutHead(0);
                improveLayoutBody(0);
                setLinesInColorAndCorrectColspan(0);
            }

            // Build mutation observer for body.
            function buildObserverBodyLists() {
                var observerBodyLists = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        processAll();
                    });
                });
                var target = document.querySelector('body');
                var config = { attributes: true, childList: true, characterData: true };
                observerBodyLists.observe(target, config);
            }
            // Check if mutation observer for body can be build.
            function checkForBuildObserverBodyLists(waitCount) {
                if ($('body')[0]) {
                    if ($('.gclh_buildObserverBodyLists')[0]) return;
                    $('body').addClass('gclh_buildObserverBodyLists');
                   buildObserverBodyLists();
                } else {waitCount++; if (waitCount <= 200) setTimeout(function(){checkForBuildObserverBodyLists(waitCount);}, 50);}
            }

            // Build mutation observer for the buttons.
            function buildObserverButtonsLists() {
                var observerButtonsLists = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        processAll();
                        checkForBuildObserverBodyLists(0);
                    });
                });
                var target = document.querySelector('.desktop-nav-display');
                var config = { attributes: true, childList: true, characterData: true };
                observerButtonsLists.observe(target, config);
            }
            // Check if mutation observer for the buttons can be build.
            function checkForBuildObserverButtonsLists(waitCount) {
                if ($('.gc-button-group')[0]) {
                    buildObserverButtonsLists();
                } else {waitCount++; if (waitCount <= 200) setTimeout(function(){checkForBuildObserverButtonsLists(waitCount);}, 50);}
            }

            checkForBuildObserverBodyLists(0);
            checkForBuildObserverButtonsLists(0);
            processAll();
        } catch(e) {gclh_error("Improve new lists page",e);}
    }

// Improve old bookmark lists.
    if (document.location.href.match(/\.com\/bookmarks\/(view\.aspx\?guid=|bulk\.aspx\?listid=|view\.aspx\?code=)/) && document.getElementById('ctl00_ContentBody_ListInfo_cboItemsPerPage')) {
        try {
            var css = "";
            // Compact layout.
            if (settings_compact_layout_bm_lists) {
                // Header:
                css += "#ctl00_ContentBody_lbHeading a {font-weight: normal; font-size: 13px; margin-left: 10px;}";
                css += "#ctl00_ContentBody_QuickAdd {margin-bottom: 1px; float: left; position: relative;} #ctl00_ContentBody_btnAddBookmark {margin-top: 1px; margin-left: -1px;}";
                css += "#ctl00_ContentBody_ListInfo_uxAbuseReport > div:nth-child(1) {margin: 0 !important; padding: 4px 0;}";  // GC Tour
                if ($('#ctl00_ContentBody_lbHeading').length > 0 && $('#divContentMain h2').length > 0) {
                    var h3 = document.createElement("h3");
                    $('#ctl00_ContentBody_lbHeading')[0].parentNode.parentNode.insertBefore(h3, $('#ctl00_ContentBody_lbHeading')[0].parentNode);
                    $('#divContentMain h3').closest('h3').append($('#ctl00_ContentBody_lbHeading').remove().get().reverse());
                    $('#divContentMain h2')[0].closest('h2').remove();
                }
                if ($('#ctl00_ContentBody_QuickAdd').length > 0) {
                    css += "#divContentMain div.span-20.last {margin-top: -18px;}";
                    $('#ctl00_ContentBody_QuickAdd')[0].children[0].childNodes[1].remove();
                    $('#ctl00_ContentBody_QuickAdd')[0].children[0].childNodes[0].remove();
                }
                if ($('#ctl00_ContentBody_ListInfo_uxListOwner').length > 0) {
                    var LO = $('#ctl00_ContentBody_ListInfo_uxListOwner')[0].parentNode;
                    if (LO.nextElementSibling.nextElementSibling.innerHTML == "") LO.nextElementSibling.nextElementSibling.remove();
                    else LO.nextElementSibling.nextElementSibling.style.marginBottom = "0";
                    if (LO.nextElementSibling.innerHTML == "") LO.nextElementSibling.remove();
                    else LO.nextElementSibling.style.marginBottom = "0";
                    LO.style.marginBottom = "0";
                }
                // Table:
                css += "table.Table tr {line-height: 16px;}";
                css += "table.Table th, table.Table td {border-left: 1px solid #fff; border-right: 1px solid #fff;} tr.BorderTop td {border-top: 1px solid #fff;}";
                css += "table.Table th {border-bottom: 2px solid #fff;} table.Table td, table.Table td img, table.Table td a {vertical-align: top !important;}";
                var lines = $('table.Table tbody').find('tr');
                for (var i = 0; i < lines.length; i += 2) {
                    if (!lines[i].className.match(/BorderTop/)) lines[i].className += " BorderTop";
                    if (lines[i].children[1].childNodes[3] && lines[i].children[1].childNodes[3].nodeName == "BR") {
                        lines[i].children[1].childNodes[3].outerHTML = "&nbsp;&nbsp;";
                    }
                    lines[i].children[1].style.whiteSpace = "nowrap";
                    if (lines[i].children[5]) lines[i].children[5].style.whiteSpace = "nowrap";
                    if (lines[i+1].children[1].innerHTML == "") lines[i+1].style.display = "table-column";
                }
                // Footer:
                if ($('#ctl00_ContentBody_ListInfo_btnDeleteBookmarkList')[0]) $('#ctl00_ContentBody_ListInfo_btnDeleteBookmarkList').closest('p').append($('#ctl00_ContentBody_btnCreatePocketQuery').remove().get().reverse());
            }
            // Build link "Map List" right above.
            if ($('#ctl00_ContentBody_btnAddBookmark')[0] && $('#ctl00_ContentBody_ListInfo_cboItemsPerPage')[0]) {
                var span = document.createElement("span");
                span.innerHTML += '<a id="gclh_map" title="Map link not determined" class="gclh_link working" href="javascript:void(0);">Map List</a>';
                $('#ctl00_ContentBody_btnAddBookmark')[0].parentNode.insertBefore(span, $('#ctl00_ContentBody_btnAddBookmark')[0].previousSibling.previousSibling);
                css += ".gclh_link {margin-left: 4px;}";
                if ($('#ctl00_ContentBody_lbHeading')[0].childNodes[0]) getBMLAct($('#ctl00_ContentBody_lbHeading')[0].childNodes[0].data.replace(/(\s+)$/,''));
            }
            // Build buttons "Add additional info" and "Hide Text" right beside button "Copy List".
            if ($('#ctl00_ContentBody_ListInfo_btnCopyList')[0]) {
                var span = document.createElement("span");
                span.innerHTML += '<input id="gclh_linkAdditionalInfo" title="Add additional information (Corrected Coordinates - Difficulty/Terrain)" value="Add additional information" class="gclh_bt" type="button">';
                span.innerHTML += '<input id="gclh_hideTextBm" title="Show/hide Longtext in Bookmark" value="Hide Text" class="gclh_bt gclh_lt" type="button">';
                $('#ctl00_ContentBody_ListInfo_btnCopyList')[0].parentNode.insertBefore(span, $('#ctl00_ContentBody_ListInfo_btnCopyList')[0].nextSibling);
                css += ".cc_cell {text-align: left !important}";
                css += ".gclh_hideBm {display: table-column;}";
                css += ".gclh_bt {margin-left: 4px;} .working {opacity: 0.3; cursor: default;}";
                $('#gclh_linkAdditionalInfo')[0].addEventListener("click", addAdditionalInfoForBM, false);
                $('#gclh_hideTextBm')[0].addEventListener("click", hideTextBm, false);
            }
            // Build button "Download as kml" right beside button "Download .LOC".
            if ($('#ctl00_ContentBody_ListInfo_btnDownload')[0]) {
                if (document.location.href.match(/guid=([a-zA-Z0-9-]*)/)) {
                    var matches = document.location.href.match(/guid=([a-zA-Z0-9-]*)/);
                    if (matches && matches[1]) {
                        var uuidx = matches[1];
                        var span = document.createElement("span");
                        span.innerHTML += '<input id="gclh_kml" title="Download Google Earth kml" value="Download as kml" onClick="document.location.href=\'https://www.geocaching.com/kml/bmkml.aspx?bmguid='+uuidx+'\';" class="gclh_bt" type="button">';
                        $('#ctl00_ContentBody_ListInfo_btnDownload')[0].parentNode.insertBefore(span, $('#ctl00_ContentBody_ListInfo_btnDownload')[0].nextSibling);
                    }
                }
            }
            appendCssStyle(css);
        } catch(e) {gclh_error("Improve bookmark lists",e);}
    }
    // Daten der aktuellen BML ermitteln.
    function getBMLAct(name) {
        GM_xmlhttpRequest({
            method: 'GET',
            url: 'https://www.geocaching.com/account/oauth/token',
            onload: function (result) {
                if (result.status >= 200 && result.status < 300) {
                    var response = JSON.parse(result.responseText);
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: 'https://www.geocaching.com/api/proxy/web/v1/lists/?type=bm&take=1000',
                        headers: {'Authorization': response.token_type + ' ' + response.access_token, 'Content-Type': 'application/json;charset=utf-8'},
                        onload: function (result) {
                            if (result.status >= 200 && result.status < 300) {
                                var BML = JSON.parse(result.responseText);
                                var BMLAct = {};
                                var c = 0;
                                for (i = 0; i < BML["total"]; i++) {
                                    if (BML["data"][i].name == name) {
                                        BMLAct = BML["data"][i];
                                        c++;
                                    }
                                }
                                if (BMLAct && c == 1 && $('#gclh_map')[0]) {
                                    $('#gclh_map')[0].href = BMLAct.mapLink;
                                    $('#gclh_map')[0].title = 'Map List';
                                    $('#gclh_map').removeClass('working');
                                }
                            }
                        },
                    });
                }
            },
        });
    }
    // Mark caches with corrected coords.
    function addAdditionalInfoForBM() {
        if ($('#gclh_linkAdditionalInfo.working')[0]) return;
        $('#gclh_linkAdditionalInfo').addClass('working');
        var anzLines = $('table.Table tbody tr').length / 2;
        if ($('table.Table tbody tr').first().find('td:nth-child(4)').find('img[src*="WptTypes"]')[0]) var colGccode = 3;
        else var colGccode = 4;
        var colName = colGccode + 1;
        $('table.Table tbody tr').each(function() {
            if ($(this).find('td:nth-child('+colGccode+') a')[0]) {
                var gccode = $(this).find('td:nth-child('+colGccode+') a')[0].innerHTML;
                if (!$('#gclh_colAdditionalInfo')[0]) $(this).find('td:nth-child('+colName+')').after('<td id="cc_'+gccode+'" class="cc_cell"></td>');
                else $('#cc_'+gccode)[0].innerHTML = "";
            } else {
                if (!$('#gclh_colAdditionalInfo')[0]) $(this).find('td:nth-child(2)').after('<td></td>');
                return;
            }
            $.get('https://www.geocaching.com/geocache/'+gccode, null, function(text){
                var corr_gccode = $(text).find('#ctl00_ContentBody_CoordInfoLinkControl1_uxCoordInfoCode')[0].innerHTML;
                // coorected coords
                if (text.includes('"isUserDefined":true,"newLatLng"')) $('#cc_'+corr_gccode)[0].innerHTML = '<img title="Corrected Coordinates" alt="Corr. Coords" src="'+global_green_tick+'">';
                else $('#cc_'+corr_gccode)[0].innerHTML = '<img style="opacity: 0.8;" title="No Corrected Coordinates" alt="No Corr. Coords" src="'+global_red_tick+'">';
                var diff = $(text).find("#ctl00_ContentBody_uxLegendScale img").attr("alt");
                diff = diff.substr(0,diff.indexOf(' '));
                var terr = $(text).find("#ctl00_ContentBody_Localize12 img").attr("alt");
                terr = terr.substr(0,terr.indexOf(' '));
                $('#cc_'+corr_gccode)[0].innerHTML = $('#cc_'+corr_gccode)[0].innerHTML + ' - D'+diff+'/T'+terr;
                anzLines--;
                if (anzLines == 0) $('#gclh_linkAdditionalInfo').removeClass('working');
            });
        });
        if (!$('#gclh_colAdditionalInfo')[0]) $('table.Table thead tr th:nth-child('+colName+')').after('<th id="gclh_colAdditionalInfo" style="width: 92px;"><span title="Additional information (Corrected Coordinates - Difficulty/Terrain)">Corr.Coords - D/T</span></th>');
        if (settings_new_width >= 1050) appendCssStyle("#gclh_colAdditionalInfo {width: 122px !important;}");
    }
    // Show, hide Longtext/Description.
    function hideTextBm() {
        if ($('#gclh_hideTextBm.working')[0]) return;
        $('#gclh_hideTextBm').addClass('working');
        setTimeout(function() {
            if ($('#gclh_hideTextBm.gclh_lt')[0]) var qual = 'table.Table tbody tr[id$="_dataRow2"]';
            else if ($('#gclh_hideTextBm.gclh_desc')[0]) var qual = 'table.Table tbody tr td:nth-child(4) span';
            if (qual) {
                $(qual).each(function() {
                    if (!$('#gclh_hideTextBm.gclh_firstDone')[0] && !this.style.display) $(this).addClass('gclh_showHideBm');
                    if (this.className.match("gclh_showHideBm")) this.classList.toggle('gclh_hideBm');
                });
                if (!$('#gclh_hideTextBm.gclh_firstDone')[0]) $('#gclh_hideTextBm').addClass('gclh_firstDone');
                $('#gclh_hideTextBm')[0].value = ($('.gclh_hideBm')[0] ? "Show Text" : "Hide Text");
                $('#gclh_hideTextBm').removeClass('working');
            }
        }, 200);
    }

// Add buttons to old bookmark lists and watchlist to select caches.
    var current_page;
    if (document.location.href.match(/\.com\/bookmarks/) && !document.location.href.match(/\.com\/bookmarks\/default/)) current_page = "bookmark";
    else if (document.location.href.match(/\.com\/my\/watchlist\.aspx/)) current_page = "watch";
    if (!!current_page) {
        try {
            var checkbox_selector = 'input[type=checkbox]';
            var table = $('table.Table').first();
            var rows = table.find('tbody tr');
            var checkboxes = table.find(checkbox_selector);
            if (table.length > 0 && rows.length > 0 && checkboxes.length > 0) {
                var button_wrapper = $('<td colspan="10">Select caches: </td>');
                var button_template = $('<a style="cursor:pointer; margin-right: 10px;" />');
                if (current_page == "bookmark") sums = sumsCreateFields(settings_show_sums_in_bookmark_lists);
                else sums = sumsCreateFields(settings_show_sums_in_watchlist);
                sumsCountAll();
                sumsSetEventsForCheckboxes(table.find('tbody tr').find(checkbox_selector));
                button_wrapper.append(button_template.clone().text('All').click(function() {
                    checkboxes.prop('checked', 'true');
                    sumsCountChecked_SelectionAll();
                }));
                sumsOutputFields(button_wrapper, "All");
                button_wrapper.append(button_template.clone().text('None').click(function() {
                    checkboxes.prop('checked', false);
                    sumsCountChecked_SelectionNone();
                }));
                button_wrapper.append(button_template.clone().text('Invert').click(function() {
                    checkboxes.each(function() {
                        this.checked = !this.checked;
                    });
                    sumsCountChecked_SelectionInvert();
                }));
                button_wrapper.append($('<span style="margin-right:10px">|</span>'));
                if (current_page !== "watch") {  // Hide on watchlist
                    button_wrapper.append(button_template.clone().text('Found').click(function() {
                        table.find('img[src*="found"]').closest('tr').find(checkbox_selector).each(function() {
                            this.checked = !this.checked;
                        });
                        sumsCountCheckedAll();
                    }));
                    sumsOutputFields(button_wrapper, "Found");
                }
                button_wrapper.append(button_template.clone().text('Archived').click(function() {
                    table.find('span.Strike.OldWarning,span.Strike.Warning').closest('tr').find(checkbox_selector).each(function() {
                        this.checked = !this.checked;
                    });
                    sumsCountCheckedAll();
                }));
                sumsOutputFields(button_wrapper, "Archived");
                button_wrapper.append(button_template.clone().text('Deactivated').click(function() {
                    table.find('span.Strike:not(.OldWarning,.Warning)').closest('tr').find(checkbox_selector).each(function() {
                        this.checked = !this.checked;
                    });
                    sumsCountCheckedAll();
                }));
                sumsOutputFields(button_wrapper, "Deactivated");
                if (settings_past_events_on_bm) {
                    button_wrapper.append(button_template.clone().text('Past Events').click(function() {
                        table.find('.gclhPastEvent').closest('tr').find(checkbox_selector).each(function() {
                            this.checked = !this.checked;
                        });
                        sumsCountCheckedAll();
                    }));
                    sumsOutputFields(button_wrapper, "PastEvents");
                    prepare_events();
                }

                var tfoot = $('<tfoot />').append($('<tr />').append(button_wrapper));
                table.append(tfoot);
                checkboxes.prop('checked', false);
                sumsChangeAllFields();
                if ($('#ctl00_ContentBody_WatchListControl1_uxWatchList_ctl00_uxChkAll')[0]) $('#ctl00_ContentBody_WatchListControl1_uxWatchList_ctl00_uxChkAll')[0].style.display = "none";
                if ($('#ctl00_ContentBody_ListInfo_uxUncheckAllImage')[0]) $('#ctl00_ContentBody_ListInfo_uxUncheckAllImage')[0].style.display = "none";
            }
        } catch(e) {gclh_error("Add buttons to bookmark list and watchlist",e);}
    }
    function prepare_events() {
        var today = new Date();
        table.find('img[src*="/sm/6."],img[src*="/sm/13."],img[src*="/sm/453."],img[src*="/sm/7005."]').closest('td').each(function() {
            var url = (current_page == "bookmark" ? this.children[0].href : this.nextElementSibling.children[0].href)
            $.get(url, null, function(text){
                url = url.replace("https://www.geocaching.com", "");
                var name = $(text).find('#ctl00_ContentBody_CacheName').closest('span')[0];
                // Date looks like "end: new Date(2014, 06-1, 21,"
                var tDate = text.match(/end:\snew\sDate\((([12]\d{3}),\s(0[1-9]|1[0-2])-\d,\s(0[1-9]|[12]\d|3[01])),/);
                if (name && name.innerHTML && tDate && tDate[2] && tDate[3] && tDate[4]) {
                    var date = new Date(tDate[2], tDate[3]-1, tDate[4]);
                    if ($('#ctl00_ContentBody_ListInfo_uxListOwner')[0]) var a = table.find('a[href*="'+url+'"]').find('img').closest('a')[0];
                    else var a = table.find('a[href*="'+url+'"]').closest('a')[0];
                    if ($(a).find('span')[0]) {
                        $(a).find('span')[0].innerText = "";
                        if ($(a).find('span')[0].nextSibling) $(a).find('span')[0].nextSibling.data = ""; }
                    else if ($(a).find('img')[0]) $(a).find('img')[0].nextSibling.data = "";
                    else a.innerText = "";
                    var span = document.createElement('span');
                    a.append(span);
                    $(a).find('span')[0].innerText = " " + name.innerHTML;
                    var span = document.createElement('span');
                    span.innerHTML = " (" + date.toLocaleDateString() + ")";
                    a.parentNode.insertBefore(span, a.nextSibling);
                    if (today.getTime() > date) {
                        $(a).find('span')[0].className += " gclhPastEvent";
                        $(a).find('span')[0].title += "Past Event";
                        a.nextSibling.title = "Past Event";
                        a.nextSibling.style.color = "#8c0b0b";
                        sums["PastEvents"]++;
                        sumsChangeFields("PastEvents", sums["chPastEvents"], sums["PastEvents"]);
                    } else a.nextSibling.title = "Event Date";
                }
            });
        });
    }
    // Summenfelder Anzahl Caches definieren, Configparameter setzen.
    function sumsCreateFields(configParameter) {
        var sums = new Object();
        sums["All"] = sums["chAll"] = sums["Found"] = sums["chFound"] = sums["Archived"] = sums["chArchived"] = sums["Deactivated"] = sums["chDeactivated"] = sums["chPastEvents"] = 0;
        sums["configParameter"] = configParameter;
      return sums;
    }
    // Anzahl Caches.
    function sumsCountAll() {
        if (sums["configParameter"] == false) return;
        sums["All"] = table.find('tbody tr').find(checkbox_selector).length;
        sums["Found"] = table.find('tbody tr').find('img[src*="found"]').length;
        sums["Archived"] = table.find('tbody tr').find('span.Strike.OldWarning,span.Strike.Warning').length;
        sums["Deactivated"] = table.find('tbody tr').find('span.Strike:not(.OldWarning,.Warning)').length;
        sums["PastEvents"] = table.find('tbody tr').find('.gclhPastEvent').length;
    }
    // Events für Checkboxen setzen.
    function sumsSetEventsForCheckboxes(checkboxes) {
        if (sums["configParameter"] == false) return;
        for (var i = 0; i < checkboxes.length; i++) {
            checkboxes[i].addEventListener("click", function() {sumsCountChecked_Click(this);} , false);
        }
    }
    // Platzhalter für Anzahl Caches.
    function sumsOutputFields(side, kind) {
        if (sums["configParameter"] == false) return;
        var out = document.createElement('span');
        out.setAttribute("style", "font-size: 85%; font-style: italic; margin-left: -6px; margin-right: 10px;");
        out.setAttribute("id", "sums_caches_" + kind);
        out.appendChild(document.createTextNode(""));
        side.append(out);
    }
    // Werte für Anzahl Caches ändern.
    function sumsChangeAllFields() {
        if (sums["configParameter"] == false) return;
        sumsChangeFields("All", sums["chAll"], sums["All"]);
        sumsChangeFields("Found", sums["chFound"], sums["Found"]);
        sumsChangeFields("Archived", sums["chArchived"], sums["Archived"]);
        sumsChangeFields("Deactivated", sums["chDeactivated"], sums["Deactivated"]);
        sumsChangeFields("PastEvents", sums["chPastEvents"], sums["PastEvents"]);
    }
    function sumsChangeFields(kind, sums_ch, sums) {
        if (sums["configParameter"] == false) return;
        var outSums = "(" + sums_ch + "|" + sums + ")";
        var outTitle = sums_ch + " of " + sums + " caches selected";
        var outId = "sums_caches_" + kind;
        if (document.getElementById(outId)) {
            var side = document.getElementById(outId);
            side.setAttribute("title", outTitle);
            side.innerHTML = outSums;
        }
    }
    // Anzahl markierte Caches für Selektion All, None, Invert.
    function sumsCountChecked_SelectionAll() {
        if (sums["configParameter"] == false) return;
        sums["chAll"] = sums["All"];
        sums["chFound"] = sums["Found"];
        sums["chArchived"] = sums["Archived"];
        sums["chDeactivated"] = sums["Deactivated"];
        sums["chPastEvents"] = sums["PastEvents"];
        sumsChangeAllFields();
    }
    function sumsCountChecked_SelectionNone() {
        if (sums["configParameter"] == false) return;
        sums["chAll"] = sums["chFound"] = sums["chArchived"] = sums["chDeactivated"] = sums["chPastEvents"] = 0;
        sumsChangeAllFields();
    }
    function sumsCountChecked_SelectionInvert() {
        if (sums["configParameter"] == false) return;
        sums["chAll"] = sums["All"] - sums["chAll"];
        sums["chFound"] = sums["Found"] - sums["chFound"];
        sums["chArchived"] = sums["Archived"] - sums["chArchived"];
        sums["chDeactivated"] = sums["Deactivated"] - sums["chDeactivated"];
        sums["chPastEvents"] = sums["PastEvents"] - sums["chPastEvents"];
        sumsChangeAllFields();
    }
    // Anzahl markierte Caches für Click auf Checkbox.
    function sumsCountChecked_Click(checkbox) {
        if (checkbox.checked) sums["chAll"]++;
        else sums["chAll"]--;
        var cbId = checkbox.id;
        if ($('#'+cbId).closest('tr').find('img[src*="found"]').length > 0) {
            if (checkbox.checked) sums["chFound"]++;
            else sums["chFound"]--;
        }
        if ($('#'+cbId).closest('tr').find('span.Strike.OldWarning,span.Strike.Warning').length > 0) {
            if (checkbox.checked) sums["chArchived"]++;
            else sums["chArchived"]--;
        }
        if ($('#'+cbId).closest('tr').find('span.Strike:not(.OldWarning,.Warning)').length > 0) {
            if (checkbox.checked) sums["chDeactivated"]++;
            else sums["chDeactivated"]--;
        }
        if ($('#'+cbId).closest('tr').find('.gclhPastEvent').length > 0) {
            if (checkbox.checked) sums["chPastEvents"]++;
            else sums["chPastEvents"]--;
        }
        sumsChangeAllFields();
    }
    // Anzahl markierter Caches für alles.
    function sumsCountCheckedAll() {
        if (sums["configParameter"] == false) return;
        sums["chAll"] = table.find('tbody tr').find(checkbox_selector + ':checked').length;
        sums["chFound"] = table.find('tbody tr').find('img[src*="found"]').closest('tr').find(checkbox_selector + ':checked').length;
        sums["chArchived"] = table.find('tbody tr').find('span.Strike.OldWarning,span.Strike.Warning').closest('tr').find(checkbox_selector + ':checked').length;
        sums["chDeactivated"] = table.find('tbody tr').find('span.Strike:not(.OldWarning,.Warning)').closest('tr').find(checkbox_selector + ':checked').length;
        sums["chPastEvents"] = table.find('tbody tr').find('.gclhPastEvent').closest('tr').find(checkbox_selector + ':checked').length;
        sumsChangeAllFields();
    }

// Improve friends list.
    if (document.location.href.match(/\.com\/my\/myfriends\.aspx/) && $('#ctl00_ContentBody_btnAddFriend')[0]) {
        try {
            var friends = document.getElementsByClassName("FriendText");
            var day = new Date().getDate();
            var last_check = parseInt(getValue("friends_founds_last", "0"), 10);
            if (settings_automatic_friend_reset && last_check != day) {
                for (var i = 0; i < friends.length; i++) {
                    var friend = friends[i];
                    var name = friend.getElementsByTagName("a")[0];
                    if (getValue("friends_founds_new_" + name.innerHTML)) setValue("friends_founds_" + name.innerHTML, getValue("friends_founds_new_" + name.innerHTML));
                    if (getValue("friends_hides_new_" + name.innerHTML)) setValue("friends_hides_" + name.innerHTML, getValue("friends_hides_new_" + name.innerHTML));
                }
                setValue("friends_founds_last", day);
                var last_autoreset = getValue("friends_founds_last_autoreset");
                if (typeof(last_autoreset) != "undefined") setValue("friends_founds_last_reset", last_autoreset);
                setValue("friends_founds_last_autoreset", new Date().getTime());
            }
            var myf =
                 "a.myfriends:hover {" +
                 "  text-decoration:underline;}" +
                 "a.myfriends {" +
                 "  color:#00AA00;" +
                 "  text-decoration:none;}";
            appendCssStyle(myf);
            var sNewF = "";
            var sNewH = "";
            var myvips = getValue("vips", false);
            if (!myvips) myvips = new Array();
            else {
                myvips = myvips.replace(/, (?=,)/g, ",null");
                myvips = JSON.parse(myvips);
            }
            for (var i = 0; i < friends.length; i++) {
                var friend = friends[i];
                var name = friend.getElementsByTagName("a")[0];
                var add = "";
                // Founds.
                var founds = parseInt(trim(friend.getElementsByTagName("dd")[3].innerHTML).replace(/[,.]*/g, ""));
                if (isNaN(founds)) founds = 0;
                var last_founds = getValue("friends_founds_" + name.innerHTML);
                if (typeof(last_founds) == "undefined") {
                    last_founds = founds;
                    setValue("friends_founds_" + name.innerHTML, last_founds);
                }
                if ((founds - last_founds) > 0) add = " <font color='#00AA00'><b>(+" + (founds - last_founds) + ")</b></font>";
                setValue("friends_founds_new_" + name.innerHTML, founds);
                // Wenn neue Founds, dann User und Funddifferenz als Link zu string hinzufuegen (ggf. nur VIPs).
                if  ((settings_friendlist_summary_viponly && in_array(name.innerHTML, myvips)) || (!settings_friendlist_summary_viponly)) {
                    if ((founds - last_founds) > 0) {
                        if (sNewF != "") sNewF = sNewF + ",&nbsp;";
                        var sHlp = name.innerHTML + " (";
                        if ((founds - last_founds) > 0) sHlp = sHlp + "+";
                        else sHlp = sHlp + "-";
                        sHlp = sHlp + (founds - last_founds) + ")";
                        sNewF = sNewF + "<a class='myfriends' href='/seek/nearest.aspx?ul=" + urlencode(name.innerHTML) + "&disable_redirect='>" + sHlp + "</a>";
                    }
                }
                if (founds == 0) friend.getElementsByTagName("dd")[3].innerHTML = founds + "&nbsp;";
                else friend.getElementsByTagName("dd")[3].innerHTML = "<a href='/seek/nearest.aspx?ul=" + urlencode(name.innerHTML) + "&disable_redirect='>" + founds + "</a>&nbsp;" + add;
                // Hides.
                add = "";
                var hides = parseInt(trim(friend.getElementsByTagName("dd")[4].innerHTML).replace(/[,.]*/g, ""));
                if (isNaN(hides)) hides = 0;
                var last_hides = getValue("friends_hides_" + name.innerHTML);
                if (typeof(last_hides) == "undefined") {
                    last_hides = hides;
                    setValue("friends_hides_" + name.innerHTML, last_hides);
                }
                if ((hides - last_hides) > 0) add = " <font color='#00AA00'><b>(+" + (hides - last_hides) + ")</b></font>";
                setValue("friends_hides_new_" + name.innerHTML, hides);
                // Wenn neue Hides, dann User und Funddifferenz als Link zu string hinzufuegen (ggf. nur VIPs).
                if  ((settings_friendlist_summary_viponly && in_array(name.innerHTML, myvips)) || (!settings_friendlist_summary_viponly)) {
                    if ((hides - last_hides) > 0) {
                        if (sNewH != "") sNewH = sNewH + ",&nbsp;";
                        var sHlp = name.innerHTML + " (";
                        if ((hides - last_hides) > 0) sHlp = sHlp + "+";
                        else sHlp = sHlp + "-";
                        sHlp = sHlp + (hides - last_hides) + ")";
                        sNewH = sNewH + "<a class='myfriends' href='/seek/nearest.aspx?u=" + urlencode(name.innerHTML) + "&disable_redirect='>" + sHlp + "</a>";
                    }
                }
                if (hides == 0) friend.getElementsByTagName("dd")[4].innerHTML = hides + "&nbsp;";
                else friend.getElementsByTagName("dd")[4].innerHTML = "<a href='/seek/nearest.aspx?u=" + urlencode(name.innerHTML) + "&disable_redirect='>" + hides + "</a>&nbsp;" + add;
                // Location.
                var friendlocation = trim(friend.getElementsByTagName("dd")[2].getElementsByTagName("span")[0].innerHTML);
                if (friendlocation != "" && friendlocation != "not listed" && friendlocation.length > 3) {
                    friend.getElementsByTagName("dd")[2].getElementsByTagName("span")[0].innerHTML = "<a href='http://maps.google.de/?q=" + (friendlocation.replace(/&/g, "")) + "' target='_blank'>" + friendlocation + "</a>";
                }
                // Bottom line.
                friend.getElementsByTagName("p")[0].innerHTML = "<a name='lnk_profilegallery2' href='" + name.href + '#gclhpb#ctl00_ContentBody_ProfilePanel1_lnkGallery' + "'>Gallery</a> | " + friend.getElementsByTagName("p")[0].innerHTML;
            }
            function gclh_reset_counter() {
                var friends = document.getElementsByClassName("FriendText");
                var resetTime = new Date().getTime();
                setValue("friends_founds_last_reset", resetTime);
                if (settings_automatic_friend_reset) setValue("friends_founds_last_autoreset", resetTime);
                for (var i = 0; i < friends.length; i++) {
                    var friend = friends[i];
                    var name = friend.getElementsByTagName("a")[0];
                    var founds = 0;
                    var hides = 0;
                    founds = getValue("friends_founds_new_" + name.innerHTML, 0);
                    setValue("friends_founds_" + name.innerHTML, founds);
                    if (founds == 0) friend.getElementsByTagName("dd")[3].innerHTML = "0&nbsp;";
                    else friend.getElementsByTagName("dd")[3].innerHTML = "<a href='/seek/nearest.aspx?ul=" + urlencode(name.innerHTML) + "&disable_redirect='>" + founds + "</a>";
                    hides = getValue("friends_hides_new_" + name.innerHTML, 0);
                    setValue("friends_hides_" + name.innerHTML, hides);
                    if (hides == 0) friend.getElementsByTagName("dd")[4].innerHTML = "0&nbsp;";
                    else friend.getElementsByTagName("dd")[4].innerHTML = "<a href='/seek/nearest.aspx?u=" + urlencode(name.innerHTML) + "&disable_redirect='>" + hides + "</a>&nbsp;";
                }
                if (settings_friendlist_summary) {
                    // Wenn Reset, dann Differenzen nicht mehr anzeigen...
                    var divFH = document.getElementsByClassName("divFHclass");
                    for (var i = 0; i < divFH.length; i++) {
                        var divC = divFH[i];
                        divC.innerHTML = "";
                    }
                    // und "last reset" aktualisieren.
                    var spanTTs = document.getElementsByClassName("spanTclass");
                    var ld1 = getValue("friends_founds_last_reset", 0);
                    spanTTs[0].innerHTML = '<br><br>Last reset was 0 seconds ago (' + new Date(parseInt(ld1, 10)).toLocaleString() + ')';
                }
            }
            if (settings_friendlist_summary) {
                // "last reset" anzeigen.
                var spanT = document.createElement("span");
                var ld = getValue("friends_founds_last_reset", 0);
                if (ld == 0) {
                   ld = new Date().getTime();
                   setValue("friends_founds_last_reset", ld);
                }
                spanT.className = "spanTclass";
                spanT.style.color = "gray";
                spanT.style.fontSize = "smaller";
                spanT.innerHTML = '<br>Last reset was ' + getDateDiffString(new Date().getTime(), ld) + ' ago (' + new Date(parseInt(ld, 10)).toLocaleString() + ')';
                if ((sNewH == "") && (sNewF == "")) spanT.innerHTML = '<br>' + spanT.innerHTML;
                document.getElementById('ctl00_ContentBody_btnAddFriend').parentNode.insertBefore(spanT, document.getElementById('ctl00_ContentBody_btnAddFriend').nextSibling);
                // Wenn neue Hides -> anzeigen.
                if (sNewH != "") {
                    var boxH = document.createElement("div");
                    boxH.innerHTML = "<br><b>New hides by:</b> " + sNewH;
                    boxH.className = 'divFHclass';
                    document.getElementById('ctl00_ContentBody_btnAddFriend').parentNode.insertBefore(boxH, document.getElementById('ctl00_ContentBody_btnAddFriend').nextSibling);
                }
                // Wenn neue Founds -> anzeigen.
                if (sNewF != "") {
                    var boxF = document.createElement("div");
                    boxF.innerHTML = "<br><b>New finds by:</b> " + sNewF;
                    boxF.className = 'divFHclass';
                    document.getElementById('ctl00_ContentBody_btnAddFriend').parentNode.insertBefore(boxF, document.getElementById('ctl00_ContentBody_btnAddFriend').nextSibling);
                }
            }
            var button = document.createElement("input");
            button.setAttribute("type", "button");
            button.setAttribute("value", "Reset counter");
            button.setAttribute("style", "height: 35px;");
            button.addEventListener("click", gclh_reset_counter, false);
            document.getElementById('ctl00_ContentBody_btnAddFriend').parentNode.insertBefore(button, document.getElementById('ctl00_ContentBody_btnAddFriend').nextSibling);
        } catch(e) {gclh_error("Improve friends list",e);}
    }

// Improve drafts old page.
    if (document.location.href.match(/\.com\/my\/fieldnotes\.aspx/) && $('table.Table tbody')[0]) {
        try {
            // Mark duplicate drafts.
            var existingNotes = {};
            var link = null; var date = null; var type = null;
            $('.Table tr').each(function(i, e) {
                link = $(e).find('td a[href*="cache_details.aspx?guid"]');
                if (link.length > 0) {
                    date = $($(e).find('td')[2]).text();
                    type = $($(e).find('td')[3]).text();
                    if (existingNotes[link[0].href + date + type]) {
                        $(existingNotes[link[0].href + date + type]).find('td').css("background-color", "#FE9C9C");
                        $(e).find('td').css("background-color", "#FE9C9C");
                    } else existingNotes[link[0].href + date + type] = e;
                }
            });
            // Drafts auf alte Log Seite umbiegen.
            if (settings_fieldnotes_old_fashioned) {
                var link = $('table.Table tbody td a[href*="fieldnotes.aspx?composeLog=true"]');
                for (var i = 0; i < link.length; i++) {
                    var matches = link[i].href.match(/&draftGuid=(.*)&/i);
                    if (matches && matches[1]) link[i].href = "/seek/log.aspx?PLogGuid=" + matches[1];
                }
            }
            // Grüner Haken Kopfzeile.
            var desc = "Check/Uncheck all Items";
            var haken = '<a href="javascript:void(0);"><img id="#" src="/images/silk/tick.png" alt="'+desc+'" title="'+desc+'"></a>';
            $('table.Table thead th')[0].innerHTML = haken.replace("#","gclh_all_t");
            $('#gclh_all_t')[0].addEventListener("click", gclhSelAll, false);
            // Check/Uncheck all Items.
            var mark = false;
            function gclhSelAll() {
                mark = (mark == false ? true : false);
                var cbs = $('table.Table tbody tr input');
                for (var i = 0; i < cbs.length; i++) {cbs[i].checked = mark;}
            }
            // Summenzeile.
            function buildDraftSL() {
                var tr = document.createElement('tr');
                var t = '<td style="background-color: #DFE1D2;">';
                var html = t+ haken.replace("#","gclh_all_b") +'</td>'+t;
                for (src in types) {html += ' <img src="'+src+'"> '+types[src];}
                html += t+'<b>Statistics</b></td>'+t;
                for (src in stats) {html += ' <img src="'+src+'"> '+stats[src];}
                html += t+'Sum: '+count+'</td>';
                tr.innerHTML = html;
                return tr;
            }
            var imgs = $('table.Table tbody tr img');
            var stats = new Object();
            var types = new Object();
            var count = 0;
            for (var i = 0; i < imgs.length; i++) {
                if (imgs[i].src.match(/images\/logtypes/)) {
                    if (!stats[imgs[i].src]) stats[imgs[i].src] = 0;
                    stats[imgs[i].src]++;
                    count++;
                } else {
                    if (!types[imgs[i].src]) types[imgs[i].src] = 0;
                    types[imgs[i].src]++;
                }
            }
            tr = buildDraftSL();
            $('table.Table tbody')[0].append(tr);
            $('#gclh_all_b')[0].addEventListener("click", gclhSelAll, false);
        } catch(e) {gclh_error("Improve drafts old page",e);}
    }

// Improve drafts new page.
    if ( settings_modify_new_drafts_page && is_page("drafts") ) {
        try {
            var css = "";
            css += '.gclh-draft-graphics {';
            css += '    top: 0px;';
            css += '    left: 0px;';
            css += '    position: relative;';
            css += '}';
            css += '.gclh-draft-icon {';
            css += '    width: 48px;';
            css += '    height: 48px;';
            css += '    left: 0px;';
            css += '    position: relative;';
            css += '    top: 0px;';
            css += '}';
            css += '.gclh-draft-badge {';
            css += '    width: 24px;';
            css += '    height: 24px;';
            css += '    left: -3px;';
            css += '    position: absolute;';
            css += '    top: -3px;';
            css += '    z-index: 2;';
            css += '}';
            appendCssStyle(css);

            var template = "";
            template = '';
            template += '<span class="draft-icon">';
            template += '    <a href="https://coords.info/{{geocache.referenceCode}}">';
            template += '       <div class="gclh-draft-graphics">';
            template += '           <svg class="gclh-draft-icon">';
            template += '               <use xlink:href="/account/app/ui-icons/sprites/cache-types.svg#icon-{{geocache.geocacheType.id}}{{#if disabled}}-disabled{{/if}}"></use>';
            template += '           </svg>';
            template += '           <svg class="gclh-draft-badge">';
            template += '               <use xlink:href="https://www.geocaching.com/account/app/ui-icons/sprites/log-types.svg#icon-{{logType}}"></use>';
            template += '           </svg>';
            template += '       </div>';
            template += '   </a>';
            template += '</span>';
            template += '<div class="draft-content">';
            template += '    <a href="/account/drafts/home/compose?gc={{geocache.referenceCode}}&d={{referenceCode}}&dGuid={{guid}}&lt={{logTypeId}}">';
            template += '       <dl class="meta">';
            template += '           {{#if geocache.state.isArchived}}';
            template += '           <dt class="state">';
            template += '               {{ localize "archivedLabel" }}';
            template += '           </dt>';
            template += '           <dd></dd>';
            template += '           {{else}}';
            template += '               {{#if geocache.state.isAvailable}}';
            template += '               {{else}}';
            template += '                   <dt class="state">';
            template += '                       {{ localize "disabledLabel" }}';
            template += '                   </dt>';
            template += '                   <dd></dd>';
            template += '               {{/if}}';
            template += '           {{/if}}';
            template += '           <dt>{{cacheLogType logType}}:</dt><dd><span class="date">{{happyDates logDate}}</span> <span class="timestamp">{{timestamp}}</span></dd>';
            template += '       </dl>';
            template += '       <h2 class="title">{{geocache.name}}</h2>';
            template += '       <p>{{notePreview}}</p>';
            template += '   </a>';
            template += '</div>';
            template += '<div class="draft-actions">';
            template += '    <button type="button" class="btn-icon" title="Open Listing" onclick="window.open(\'https://coords.info/{{geocache.referenceCode}}\');" style="padding-right:6px;">';
            template += '        <svg class="xicon" height="22" width="22" style="transform: rotate(135deg); ">';
            template += '            <use xlink:href="/account/app/ui-icons/sprites/global.svg#icon-back-svg-fill"></use>';
            template += '        </svg>';
            template += '    </button>';
            template += '    <button type="button" class="btn-icon js-delete" title="Delete">';
            template += '        <svg class="icon" height="24" width="24">';
            template += '            <use xlink:href="/account/app/ui-icons/sprites/global.svg#icon-delete"></use>';
            template += '        </svg>';
            template += '        <span class="visuallyhidden">{{ localize "deleteOne" }}</span>';
            template += '    </button>';
            template += '</div>';
            $("#draftItem").html(template);
        } catch(e) {gclh_error("New drafts page",e);}
    }

// Linklist on old dashboard.
    if (settings_bookmarks_show && is_page("profile") && $('#ctl00_ContentBody_WidgetMiniProfile1_LoggedInPanel')[0]) {
        try {
            var side = $('#ctl00_ContentBody_WidgetMiniProfile1_LoggedInPanel')[0];
            var div0 = document.createElement("div");
            div0.setAttribute("class", "YourProfileWidget");
            div0.setAttribute("style", "margin-left: -1px; margin-right: -1px;");  // Wegen doppeltem Border 1px
            var head = document.createElement("h3");
            head.setAttribute("class", "WidgetHeader");
            head.setAttribute("title", "Linklist");
            head.appendChild(document.createTextNode(" Linklist"));
            var div = document.createElement("div");
            div.setAttribute("class", "WidgetBody");
            var ul = document.createElement("ul");
            buildBoxElementsLinklist(ul);
            div.appendChild(ul);
            div0.appendChild(head);
            div0.appendChild(div);
            side.appendChild(div0);
        } catch(e) {gclh_error("Linklist on old dashboard",e);}
    }

// Linklist, Default Links on new dashboard.
    if (is_page("dashboard")) {
        try {
            buildDashboardCss();
            if (settings_bookmarks_show) {
                buildBoxDashboard("linklist", "Linklist", "Linklist");
                var box = document.getElementsByName("box_linklist")[0];
                box.innerHTML = "";
                buildBoxElementsLinklist(box);
            }
            if (settings_show_default_links) {
                bm_tmp = buildCopyOfBookmarks();
                sortBookmarksByDescription(true, bm_tmp);
                buildBoxDashboard("links", "Default Links", "Default Links for the Linklist");
                var box = document.getElementsByName("box_links")[0];
                box.innerHTML = "";
                buildBoxElementsLinks(box, bm_tmp);
            }
        } catch(e) {gclh_error("Linklist, Default Links on new dashboard",e);}
    }

// Loggen über Standard "Log It" Icons zu PMO Caches für Basic Members.
    if (settings_logit_for_basic_in_pmo && document.getElementsByClassName('premium').length > 0) {
        try {
            var premiumTeile = document.getElementsByClassName('premium');
            for (var i = 0; i < premiumTeile.length; i++) {
                if (premiumTeile[i] && premiumTeile[i].href && premiumTeile[i].href.match(/\/seek\/log\.aspx\?ID=/)) {
                    premiumTeile[i].addEventListener("click", function() {buildLogItLink(this);}, false);
                }
            }
        } catch(e) {gclh_error("Log-It for basic in pmo",e);}
    }
    // Link ausführen trotz Tool Tipp.
    function buildLogItLink(premiumTeil) {
        if (premiumTeil.href.match(/\/seek\/log\.aspx\?ID=/)) location = premiumTeil.href;
    }

// Show Profile-Link on display of Caches found or created by user. (Muß vor VIP laufen.)
    if (settings_show_nearestuser_profil_link && document.location.href.match(/\.com\/seek\/nearest\.aspx/) && document.location.href.match(/(ul|u)=/) && $('#ctl00_ContentBody_LocationPanel1_OriginLabel')[0]) {
        try {
            var user = getUrlUser();
            var link = document.createElement("a");
            link.href = "/profile/?u="+urlencode(user);
            link.innerHTML = user;
            var text = $('#ctl00_ContentBody_LocationPanel1_OriginLabel')[0];
            text.innerHTML = text.innerHTML.replace(/: (.*)/, ": ");
            text.appendChild(link);
        } catch(e) {gclh_error("Show Profile Link",e);}
    }

// VIP. VUP.
    try {
        if (settings_show_vip_list                                           &&
            !isMemberInPmoCache()                                            &&
            global_me                                                        &&
            !document.location.href.match(/\.com\/my\/geocaches\.aspx/)      &&          // Nicht bei eigenen Cache Logs
            !document.location.href.match(/\.com\/my\/travelbugs\.aspx/)     &&          // Nicht bei eigenen Travelbug Logs
            !document.location.href.match(/\.com\/my\/benchmarks\.aspx/)     &&          // Nicht bei eigenen Benchmark Logs
            !document.location.href.match(/\.com\/my\/favorites\.aspx/)      &&          // Nicht bei Eigene Favoriten, weil hier auch gegebenenfalls das Pseudonym steht
            (is_page("cache_listing")                                            ||      // Cache Listing (nicht in den Logs)
             is_page("publicProfile")                                            ||      // Öffentliches Profil
             document.location.href.match(/\.com\/track\/details\.aspx/)         ||      // TB Listing
             document.location.href.match(/\.com\/(seek|track)\/log\.aspx/)      ||      // Post, Edit, View Cache und TB Logs
             document.location.href.match(/\.com\/play\/geocache\/gc\w+\/log/)   ||      // Post Cache Logs neue Seite
             document.location.href.match(/\.com\/email\//)                      ||      // Mail schreiben
             document.location.href.match(/\.com\/my\/inventory\.aspx/)          ||      // TB Inventar
             document.location.href.match(/\.com\/my/)                           ||      // Profil
             document.location.href.match(/\.com\/map/)                          ||      // Map (For enhanced Popup Informations)
             document.location.href.match(/\.com\/my\/default\.aspx/)            ||      // Profil (Quicklist)
             document.location.href.match(/\.com\/account\/dashboard/)           ||      // Dashboard
             document.location.href.match(/\.com\/seek\/nearest\.aspx(.*)(\?ul|\?u|&ul|&u)=/) ||  // Nearest Lists mit User
             document.location.href.match(/\.com\/bookmarks\/(view|bulk)/)       ||      // Bookmark Lists
             document.location.href.match(/\.com\/play\/(friendleague|leaderboard)/) ||  // Friend League, Leaderboard
             document.location.href.match(/\.com\/seek\/auditlog\.aspx/)         ||      // Audit Log
             document.location.href.match(/\.com\/my\/myfriends\.aspx/)             )) { // Friends
            var myself = global_me;
            var gclh_build_vip_list = function() {};

            // Arrays für VIPs, VUPs aufbauen:
            // ----------
            var global_vips = getValue("vips", false);
            if (!global_vips) global_vips = new Array();
            else {
                global_vips = global_vips.replace(/, (?=,)/g, ",null");
                global_vips = JSON.parse(global_vips);
            }
            if (settings_process_vup) {
                var global_vups = getValue("vups", false);
                if (!global_vups) global_vups = new Array();
                else {
                    global_vups = global_vups.replace(/, (?=,)/g, ",null");
                    global_vups = JSON.parse(global_vups);
                }
            } else global_vups = new Array();

            // Add to VIPs, VUPs:
            // ----------
            function gclh_add_vip() {
                [global_vips, global_vups] = gclh_add_vipvup(this.name, global_vips, "vip", global_vups, "vup");
                gclh_build_vip_list();
                setLinesColorVip(this.name);
            }
            function gclh_add_vup() {
                [global_vups, global_vips] = gclh_add_vipvup(this.name, global_vups, "vup", global_vips, "vip");
                gclh_build_vip_list();
                setLinesColorVip(this.name);
            }
            function gclh_add_vipvup(user, addAry, addDesc, delAry, delDesc){
                addAry.push(user);
                addAry.sort(caseInsensitiveSort);
                setValue(addDesc+"s", JSON.stringify(addAry));
                var icons = document.getElementsByName(user);
                for (var i = 0; i < icons.length; i++) {
                    var img = icons[i].childNodes[0];
                    if (img.getAttribute("class") == "gclh_"+addDesc) {
                        img.setAttribute("src", (addDesc == "vip" ? global_img_vip_on : global_img_vup_on));
                        img.setAttribute("title", "Remove " + user + " from " + addDesc.toUpperCase() + "-List");
                        icons[i].removeEventListener("click", (addDesc == "vip" ? gclh_add_vip : gclh_add_vup), false);
                        icons[i].addEventListener("click", (addDesc == "vip" ? gclh_del_vip : gclh_del_vup), false);
                        if (addDesc == "vup" && is_page("cache_listing")) {
                            var rows = $(icons[i]).closest('td').find('.LogContent').children();
                            if (rows && rows[0]) {
                                rows[0].innerHTML = "censored";
                                rows[0].style.fontStyle = "unset";
                                for (var k = 1; k < rows.length; k++) {rows[k].style.display = "none";}
                            }
                        }
                    }
                }
                if (in_array(user, delAry)) delAry = gclh_del_vipvup(user, delAry, delDesc);
                return [addAry, delAry];
            }

            // Del from VIPs, VUPs:
            // ----------
            function gclh_del_vip() {
                global_vips = gclh_del_vipvup(this.name, global_vips, "vip");
                gclh_build_vip_list();
                setLinesColorVip(this.name);
            }
            function gclh_del_vup() {
                global_vups = gclh_del_vipvup(this.name, global_vups, "vup");
                gclh_build_vip_list();
                setLinesColorVip(this.name);
            }
            function gclh_del_vipvup(user, delAry, delDesc) {
                var delAryNew = new Array();
                for (var i = 0; i < delAry.length; i++) {
                    if (delAry[i] != user) delAryNew.push(delAry[i]);
                }
                delAry = delAryNew;
                setValue(delDesc+"s", JSON.stringify(delAry));
                var icons = document.getElementsByName(user);
                for (var i = 0; i < icons.length; i++) {
                    var img = icons[i].childNodes[0];
                    if (img.getAttribute("class") == "gclh_"+delDesc){
                        img.setAttribute("src", (delDesc == "vip" ? global_img_vip_off : global_img_vup_off));
                        img.setAttribute("title", "Add " + user + " to " + delDesc.toUpperCase() + "-List");
                        icons[i].removeEventListener("click", (delDesc == "vip" ? gclh_del_vip : gclh_del_vup), false);
                        icons[i].addEventListener("click", (delDesc == "vip" ? gclh_add_vip : gclh_add_vup), false);
                        if (delDesc == "vup" && is_page("cache_listing")) {
                            var rows = $(icons[i]).closest('td').find('.LogContent').children();
                            if (rows && rows[0]) {
                                if (rows.length == 1) {
                                    rows[0].innerHTML = "please refresh page";
                                    rows[0].style.fontStyle = "italic";
                                } else {
                                    rows[0].innerHTML = "";
                                    for (var k = 1; k < rows.length; k++) {rows[k].style.display = "";}
                                }
                            }
                        }
                    }
                }
                return delAry;
            }

            // Build VIP, VUP Icons:
            // ----------
            function gclh_build_vipvup(user, ary, desc, link) {
                if (link == undefined) {
                    var link = document.createElement("a");
                    var img = document.createElement("img");
                    link.appendChild(img);
                } else var img = link.childNodes[0];

                img.setAttribute("class", "gclh_"+desc);
                img.setAttribute("border", "0");
                link.setAttribute("href", "javascript:void(0);");
                link.setAttribute("name", user);
                if (in_array(user, ary)) {
                    img.setAttribute("src", (desc == "vip" ? global_img_vip_on : global_img_vup_on));
                    img.setAttribute("title", "Remove " + user + " from " + desc.toUpperCase() + "-List");
                    link.addEventListener("click", (desc == "vip" ? gclh_del_vip : gclh_del_vup), false);
                } else {
                    img.setAttribute("src", (desc == "vip" ? global_img_vip_off : global_img_vup_off));
                    img.setAttribute("title", "Add " + user + " to " + desc.toUpperCase() + "-List");
                    link.addEventListener("click", (desc == "vip" ? gclh_add_vip : gclh_add_vup), false);
                }
                return link;
            }

            // Build VIP, VUP, Mail Icons.
            // ----------
            function gclh_build_vipvupmail(side, user) {
                if (side && user && user != "") {
                    link = gclh_build_vipvup(user, global_vips, "vip");
                    side.appendChild(document.createTextNode(" "));
                    side.appendChild(link);
                    if (settings_process_vup && user != global_activ_username) {
                        link = gclh_build_vipvup(user, global_vups, "vup");
                        side.appendChild(document.createTextNode(" "));
                        side.appendChild(link);
                    }
                    buildSendIcons(side, user, "per u");
                }
            }

            // Listing: (nicht in den Logs)
            // ----------
            if (is_page("cache_listing")) {
                var all_users = new Array();
                var log_infos = new Object();
                var log_infos_long = new Array();
                var index = 0;
                var links = $('#divContentMain .span-17, #divContentMain .sidebar').find('a[href*="/profile/?guid="]');
                var owner = "";
                var owner_name = "";
                if ($('#ctl00_ContentBody_mcd1')[0]) {
                    owner = get_real_owner();
                    if (!owner) owner = urldecode($('#ctl00_ContentBody_mcd1')[0].childNodes[1].innerHTML);
                    owner_name = owner;
                }

                for (var i = 0; i < links.length; i++) {
                    if (links[i].parentNode.className != "logOwnerStats" && links[i].childNodes[0] && !links[i].childNodes[0].src) {
                        if (links[i].id) links[i].name = links[i].id; // To be able to jump to this location
                        var matches = links[i].href.match(/https?:\/\/www\.geocaching\.com\/profile\/\?guid=([a-zA-Z0-9]*)/);
                        var user = decode_innerHTML(links[i]);
                        if (links[i].parentNode.id == "ctl00_ContentBody_mcd1") user = owner;
                        // Build VUP Icon.
                        if (settings_process_vup && user != global_activ_username) {
                            link = gclh_build_vipvup(user, global_vups, "vup");
                            links[i].parentNode.insertBefore(link, links[i].nextSibling);
                            links[i].parentNode.insertBefore(document.createTextNode(" "), links[i].nextSibling);
                        }
                        // Build VIP Icon.
                        link = gclh_build_vipvup(user, global_vips, "vip");
                        links[i].parentNode.insertBefore(link, links[i].nextSibling);
                        links[i].parentNode.insertBefore(document.createTextNode(" "), links[i].nextSibling);
                    }
                }

                // Show VIP List.
                var map = $('#ctl00_ContentBody_detailWidget')[0];
                if ( map ) {
                    var box = document.createElement("div");
                    var headline = document.createElement("h3");
                    var body = document.createElement("div");
                    box.setAttribute("class", "CacheDetailNavigationWidget NoPrint");
                    headline.setAttribute("class", "WidgetHeader");
                    body.setAttribute("class", "WidgetBody");
                    body.setAttribute("id", "gclh_vip_list");
                    headline.innerHTML = "<img width='16' height='16' style='margin-bottom: -2px;' title='Very important person List' alt='VIP-List' src='/images/icons/icon_attended.gif'> VIP-List";
                    if (settings_make_vip_lists_hideable) {
                        headline.innerHTML = "<img id='lnk_gclh_vip_list' title='' src='' style='cursor: pointer'> " + headline.innerHTML;
                    }
                    box.appendChild(headline);
                    box.appendChild(body);
                    box.setAttribute("style", "margin-top: 1.5em;");
                    map.parentNode.insertBefore(box, map);
                    if (settings_make_vip_lists_hideable) {
                        showHideBoxCL("lnk_gclh_vip_list", true);
                        $('#lnk_gclh_vip_list')[0].addEventListener("click", function() {showHideBoxCL(this.id, false);}, false);
                    }
                }

                // Show VIP List "not found".
                if (settings_vip_show_nofound && map) {
                    var box2 = document.createElement("div");
                    var headline2 = document.createElement("h3");
                    var body2 = document.createElement("div");
                    box2.setAttribute("class", "CacheDetailNavigationWidget NoPrint");
                    headline2.setAttribute("class", "WidgetHeader");
                    body2.setAttribute("class", "WidgetBody");
                    body2.setAttribute("id", "gclh_vip_list_nofound");
                    headline2.innerHTML = "<img width='16' height='16' style='margin-bottom: -2px;' title='Very important person List \"not found\"' alt='VIP-List \"not found\"' src='/images/icons/icon_attended.gif'> VIP-List \"not found\"";
                    if (settings_make_vip_lists_hideable) {
                        headline2.innerHTML = "<img id='lnk_gclh_vip_list_nofound' title='' src='' style='cursor: pointer'> " + headline2.innerHTML;
                    }
                    box2.appendChild(headline2);
                    box2.appendChild(body2);
                    box2.innerHTML = box2.innerHTML;
                    map.parentNode.insertBefore(box2, map);
                    if (settings_make_vip_lists_hideable) {
                        showHideBoxCL("lnk_gclh_vip_list_nofound", true);
                        $('#lnk_gclh_vip_list_nofound')[0].addEventListener("click", function() {showHideBoxCL(this.id, false);}, false);
                    }
                }

                var css =
                    "a.gclh_log:hover {" +
                    "  text-decoration:underline;" +
                    "  position: relative;}" +
                    "a.gclh_log span {" +
                    "  display: none;" +
                    "  position: absolute;" +
                    "  top:-310px;" +
                    "  left:-702px;" +
                    "  width: 700px;" +
                    "  padding: 5px;" +
                    "  text-decoration:none;" +
                    "  text-align:left;" +
                    "  vertical-align:top;" +
                    "  color: #000000;}" +
                    "a.gclh_log:hover span {" +
                    "  display: block;" +
                    "  top: 15px;" +
                    "  border: 1px solid #8c9e65;" +
                    "  background-color:#dfe1d2;" +
                    "  z-index:10000;}";
                appendCssStyle(css);

                gclh_build_vip_list = function() {
                    var show_owner = settings_show_owner_vip_list;
                    var list = document.getElementById("gclh_vip_list");
                    if ( list == undefined ) {
                        return;
                    }
                    // Hier wird wohl Loading Icon entfernt.
                    list.innerHTML = "";

                    // Liste "not found"-VIPs.
                    var list_nofound = false;
                    if (document.getElementById("gclh_vip_list_nofound")) {
                        list_nofound = document.getElementById("gclh_vip_list_nofound");
                        list_nofound.innerHTML = "";
                    }
                    users_found = new Array();

                    function gclh_build_long_list() {
                        if (getValue("settings_load_logs_with_gclh") == false) return;
                        for (var i = 0; i < log_infos_long.length; i++) {
                            var user = log_infos_long[i]["user"];
                            if (in_array(user, global_vips) || (settings_show_owner_vip_list && user == owner_name) || (settings_show_reviewer_as_vip && log_infos_long[i]["membership_level"] == "Reviewer")) {
                                if (!log_infos_long[i]["date"]) continue;
                                if (log_infos_long[i]["icon"].match(/\/(2|10)\.png$/)) users_found.push(user);  // Für not found liste.
                                var span = document.createElement("span");
                                var profile = document.createElement("a");
                                profile.setAttribute("href", "/profile/?u=" + urlencode(user));
                                profile.innerHTML = user;
                                if (settings_show_mail_in_viplist && settings_show_mail && settings_show_vip_list) noBreakInLine(profile, 93, user);
                                else noBreakInLine(profile, 112, user);
                                if (owner_name && owner_name == user) profile.style.color = '#8C0B0B';
                                else if (user == myself) profile.style.color = 'rgb(91, 200, 51)';
                                span.appendChild(profile);
                                // Build VIP Icon. Wenn es Owner ist und Owner in VUP array, dann VUP Icon.
                                if (owner_name && owner_name == user && in_array(user, global_vups)) link = gclh_build_vipvup(user, global_vups, "vup");
                                else link = gclh_build_vipvup(user, global_vips, "vip");
                                // Log-Date and Link.
                                var log_text = document.createElement("span");
                                log_text.innerHTML = "<img src='" + log_infos_long[i]["icon"] + "'> <b>" + user + " - " + log_infos_long[i]["date"] + "</b><br>" + log_infos_long[i]["log"];
                                var log_img = document.createElement("img");
                                var log_link = document.createElement("a");
                                log_link.setAttribute("href", "#" + log_infos_long[i]["id"]);
                                log_link.className = "gclh_log";
                                log_link.addEventListener("click", function() {
                                    $('#gclh_load_all_logs')[0].click();
                                }, false);
                                log_img.setAttribute("src", log_infos_long[i]["icon"]);
                                log_img.setAttribute("border", "0");
                                log_link.appendChild(document.createTextNode(log_infos_long[i]["date"]));
                                log_link.appendChild(log_text);
                                list.appendChild(log_img);
                                list.appendChild(document.createTextNode("   "));
                                list.appendChild(log_link);
                                list.appendChild(document.createTextNode("   "));
                                list.appendChild(span);
                                list.appendChild(document.createTextNode("   "));
                                list.appendChild(link);
                                if (settings_show_mail_in_viplist && settings_show_mail && settings_show_vip_list) buildSendIcons(list, user, "per u");
                                list.appendChild(document.createElement("br"));
                            }
                        }
                    }

                    function gclh_build_list(user, is_reviewer = false) {
                        if (getValue("settings_load_logs_with_gclh") == false) return;
                        if (!show_owner && owner_name && owner_name == user) return true;
                        if (in_array(user, all_users) || (owner_name == user)) {
                            var span = document.createElement("span");
                            var profile = document.createElement("a");
                            profile.setAttribute("href", "/profile/?u=" + urlencode(user));
                            profile.innerHTML = user;
                            if (show_owner && owner_name && owner_name == user) {
                                span.appendChild(document.createTextNode("Owner: "));
                                show_owner = false;
                            } else if (user == myself){
                                span.appendChild(document.createTextNode("Me: "));
                            } else if (is_reviewer){
                                span.appendChild(document.createTextNode("Reviewer: "));
                            }
                            span.appendChild(profile);
                            // Build VIP Icon. Wenn es Owner ist und Owner in VUP array, dann VUP Icon.
                            if (owner_name && owner_name == user && in_array(user, global_vups)) link = gclh_build_vipvup(user, global_vups, "vup");
                            else link = gclh_build_vipvup(user, global_vips, "vip");
                            list.appendChild(span);
                            list.appendChild(document.createTextNode("   "));
                            list.appendChild(link);
                            if (settings_show_mail_in_viplist && settings_show_mail && settings_show_vip_list) buildSendIcons(list, user, "per u");

                            // Log-Links.
                            for (var x = 0; x < log_infos[user].length; x++) {
                                if (log_infos[user][x] && log_infos[user][x]["icon"] && log_infos[user][x]["id"]) {
                                    if (log_infos[user][x]["icon"].match(/\/(2|10)\.png$/)) users_found.push(user);  // Für not found liste.
                                    var image = document.createElement("img");
                                    var log_text = document.createElement("span");
                                    log_text.innerHTML = "<img src='" + log_infos[user][x]["icon"] + "'> <b>" + user + " - " + log_infos[user][x]["date"] + "</b><br>" + log_infos[user][x]["log"];
                                    image.setAttribute("src", log_infos[user][x]["icon"]);
                                    image.setAttribute("border", "0");
                                    if (log_infos[user][x]["date"]) {
                                        image.setAttribute("title", log_infos[user][x]["date"]);
                                        image.setAttribute("alt", log_infos[user][x]["date"]);
                                    }
                                    var a = document.createElement("a");
                                    a.setAttribute("href", "#" + log_infos[user][x]["id"]);
                                    a.className = "gclh_log";
                                    a.addEventListener("click", function() {
                                        $('#gclh_load_all_logs')[0].click();
                                    }, false);
                                    a.appendChild(image);
                                    a.appendChild(log_text);
                                    list.appendChild(document.createTextNode(" "));
                                    list.appendChild(a);
                                }
                            }
                            list.appendChild(document.createElement("br"));
                        }
                    }


                    var reviewer = new Array();
                    owner_name = html_to_str(owner_name);
                    if (settings_show_long_vip) gclh_build_long_list();
                    else {
                        if (!log_infos[owner_name]) log_infos[owner_name] = new Array();
                        gclh_build_list(owner_name);
                        // Add Reviewer data
                        if(settings_show_reviewer_as_vip){
                            for (var i = 0; i < log_infos_long.length; i++) {
                                if(log_infos_long[i]["membership_level"] == "Reviewer"){
                                    // Test if we already added him
                                    if(in_array(log_infos_long[i]["user"], reviewer)) continue;
                                    gclh_build_list(log_infos_long[i]["user"], true);
                                    reviewer.push(log_infos_long[i]["user"]);
                                }
                            }
                        }

                        for (var i = 0; i < global_vips.length; i++) {
                            // do not add Reviewer again
                            if(in_array(global_vips[i], reviewer)) continue;
                            gclh_build_list(global_vips[i]);
                        }
                    }

                    // "Not found"-Liste erstellen.
                    if ($('#gclh_vip_list_nofound')[0]) {
                        for (var i = 0; i < global_vips.length; i++) {
                            if (getValue("settings_load_logs_with_gclh") == false) break;
                            var user = global_vips[i];
                            if (in_array(user, users_found)) continue;
                            var span = document.createElement("span");
                            var profile = document.createElement("a");
                            profile.setAttribute("href", "/profile/?u=" + urlencode(user));
                            profile.innerHTML = user;
                            if (owner_name && owner_name == user) continue;
                            else if (user == myself) continue;
                            span.appendChild(profile);
                            // Build VIP Icon.
                            link = gclh_build_vipvup(user, global_vips, "vip");
                            list_nofound.appendChild(span);
                            list_nofound.appendChild(document.createTextNode("   "));
                            list_nofound.appendChild(link);
                            if (settings_show_mail_in_viplist && settings_show_mail && settings_show_vip_list) buildSendIcons(list_nofound, user, "per u");
                            list_nofound.appendChild(document.createElement("br"));
                        }
                    }
                };
                gclh_build_vip_list();

            // Old Dashboard:
            // ----------
            } else if (document.location.href.match(/\.com\/my\//) && $('#ctl00_ContentBody_uxBanManWidget')[0]) {
                function build_box_vipvup(desc) {
                    var widget = document.createElement("div");
                    var headline = document.createElement("h3");
                    var box = document.createElement("div");
                    widget.setAttribute("class", "YourProfileWidget");
                    headline.setAttribute("class", "WidgetHeader");
                    headline.setAttribute("title", "All my " + (desc == 'vip' ? 'very important persons':'very unimportant persons'));
                    headline.appendChild(document.createTextNode("All my " + desc.toUpperCase() + "s"));
                    var box2 = document.createElement("div");
                    box2.setAttribute("class", "WidgetBody");
                    box2.setAttribute("style", "padding: 0;");   // Wegen 2 WidgetBodys.
                    box.setAttribute("id", "box_" + desc + "s");
                    box.setAttribute("class", "WidgetBody");
                    widget.appendChild(headline);
                    widget.appendChild(box2);
                    box2.appendChild(box);
                    $('#ctl00_ContentBody_uxBanManWidget')[0].parentNode.insertBefore(widget, $('#ctl00_ContentBody_uxBanManWidget')[0]);
                }
                function fill_box_vipvup(ary, desc) {
                    var box = $('#box_' + desc + 's')[0];
                    if (!box) return false;
                    box.innerHTML = "";
                    for (var i = 0; i < ary.length; i++) {
                        var user = ary[i];
                        var span = document.createElement("span");
                        var profile = document.createElement("a");
                        profile.setAttribute("href", "/profile/?u=" + urlencode(user));
                        profile.innerHTML = user;
                        span.appendChild(profile);
                        // Build VIP, VUP Icon.
                        link = gclh_build_vipvup(user, ary, desc);
                        box.appendChild(span);
                        box.appendChild(document.createTextNode("   "));
                        box.appendChild(link);
                        if (settings_show_mail_in_allmyvips && settings_show_mail && settings_show_vip_list) buildSendIcons(box, user, "per u");
                        box.appendChild(document.createElement("br"));
                    }
                }
                build_box_vipvup("vip");
                fill_box_vipvup(global_vips, "vip");
                if (settings_process_vup) {
                    build_box_vipvup("vup");
                    fill_box_vipvup(global_vups, "vup");
                }
                // Verarbeitung wird durch gclh_add... und gclh_del... angestoßen. Dadurch werden beide Listen hier neu aufgebaut.
                gclh_build_vip_list = function() {
                    fill_box_vipvup(global_vips, "vip");
                    if (settings_process_vup) fill_box_vipvup(global_vups, "vup");
                };

            // New Dashboard:
            // ----------
            } else if (document.location.href.match(/\.com\/account\/dashboard/) && $('nav.sidebar-links').length > 1) {
                function build_box_vipvup(desc) {
                    buildBoxDashboard(desc, "All my " + desc.toUpperCase() + "s", "All my " + (desc == 'vip' ? 'very important persons':'very unimportant persons'));
                }
                function fill_box_vipvup(ary, desc) {
                    var box = document.getElementsByName("box_" + desc)[0];
                    if (!box) return false;
                    box.innerHTML = "";
                    for (var i = 0; i < ary.length; i++) {
                        var user = ary[i];
                        var li = document.createElement("li");
                        var profile = document.createElement("a");
                        profile.setAttribute("href", "/profile/?u=" + urlencode(user));
                        profile.innerHTML = user;
                        li.appendChild(profile);
                        // Build VIP, VUP Icon.
                        link = gclh_build_vipvup(user, ary, desc);
                        li.appendChild(link);
                        box.appendChild(li);
                        if (settings_show_mail_in_allmyvips && settings_show_mail && settings_show_vip_list) buildSendIcons(li, user, "per u");
                    }
                }
                build_box_vipvup("vip");
                fill_box_vipvup(global_vips, "vip");
                if (settings_process_vup) {
                    build_box_vipvup("vup");
                    fill_box_vipvup(global_vups, "vup");
                }
                gclh_build_vip_list = function() {
                    fill_box_vipvup(global_vips, "vip");
                    if (settings_process_vup) fill_box_vipvup(global_vups, "vup");
                };

            // Friends list:
            // ----------
            } else if (document.location.href.match(/\.com\/my\/myfriends\.aspx/)) {
                gclh_build_vip_list = function() {
                    // Delete VIP, VUP Icons. Sie werden bei Deaktivierung bzw. Aktivierung immer neu aufgebaut. Dadurch wird verhindert, dass
                    // das VUP Icon nicht stehen bleibt, wenn es als Ersatz für das VIP Icon eingebaut wurde und das VUP Icon nun deaktiviert wurde.
                    $('.gclh_vip').closest('a').remove();
                    $('.gclh_vup').closest('a').remove();
                    // VIP, VUP Icons aufbauen.
                    var links = $('a[href*="/profile/?guid="]');
                    for (var i = 0; i < links.length; i++) {
                        if (links[i].id) {
                            var user = links[i].innerHTML.replace(/&amp;/, '&');
                            // Build VUP Icon.
                            if (settings_process_vup && settings_show_vup_friends) {
                                link = gclh_build_vipvup(user, global_vups, "vup");
                                links[i].parentNode.insertBefore(link, links[i].nextSibling);
                                links[i].parentNode.insertBefore(document.createTextNode("   "), links[i].nextSibling);
                            }
                            // Build VIP Icon. Wenn User in VUP array, dann VUP Icon, wenn ansonsten das Icon nicht angezeigt werden würde.
                            if (settings_process_vup && !settings_show_vup_friends && in_array(user, global_vups)) link = gclh_build_vipvup(user, global_vups, "vup");
                            else link = gclh_build_vipvup(user, global_vips, "vip");
                            links[i].parentNode.insertBefore(link, links[i].nextSibling);
                            links[i].parentNode.insertBefore(document.createTextNode("   "), links[i].nextSibling);
                        }
                    }
                };
                gclh_build_vip_list();

            // TB Listing. Post, Edit, View Cache und TB Logs. Mail schreiben, Bookmark lists, Trackable Inventory, Audit log. (Nicht post cache log new page.)
            // ----------
            } else if (document.location.href.match(/\.com\/track\/details\.aspx/) ||
                       document.location.href.match(/\.com\/(seek|track)\/log\.aspx/) ||
                       document.location.href.match(/\.com\/email\//) ||
                       document.location.href.match(/\.com\/bookmarks\/(view\.aspx\?guid=|bulk\.aspx\?listid=|view\.aspx\?code=)/) ||
                       document.location.href.match(/\.com\/seek\/auditlog\.aspx/) ||
                       document.location.href.match(/\.com\/my\/inventory\.aspx/)) {
                var links = $('a[href*="/profile/?guid="]');
                if(document.location.href.match(/\.com\/seek\/auditlog\.aspx/)){
                    var links = $('a[href*="/profile?guid="]');
                }
                for (var i = 0; i < links.length; i++) {
                    // Wenn es hier um User "In the hands of ..." im TB Listing geht, dann nicht weitermachen weil Username nicht wirklich bekannt ist.
                    if (links[i].id == "ctl00_ContentBody_BugDetails_BugLocation") continue;
                    var matches = links[i].href.match(/https?:\/\/www\.geocaching\.com\/profile\/\?guid=([a-zA-Z0-9]*)/);
                    var user = decode_innerHTML(links[i]);
                    // Build VUP Icon.
                    if (settings_process_vup && user != global_activ_username) {
                        link = gclh_build_vipvup(user, global_vups, "vup");
                        link.children[0].setAttribute("style", "margin-left: 0px; margin-right: 0px;");
                        link.setAttribute("style", "border-bottom: none;");
                        links[i].parentNode.insertBefore(link, links[i].nextSibling);
                        links[i].parentNode.insertBefore(document.createTextNode(" "), links[i].nextSibling);
                    }
                    // Build VIP Icon.
                    link = gclh_build_vipvup(user, global_vips, "vip");
                    link.children[0].setAttribute("style", "margin-left: 0px; margin-right: 0px;");
                    link.setAttribute("style", "border-bottom: none;");
                    links[i].parentNode.insertBefore(link, links[i].nextSibling);
                    links[i].parentNode.insertBefore(document.createTextNode(" "), links[i].nextSibling);
                }

            // Post cache log new page:
            // ----------
            } else if (document.location.href.match(/\.com\/play\/geocache\/gc\w+\/log/) && $('.muted')[0] && $('.muted')[0].children[1]) {
                var id = $('.muted')[0].children[1].href.match(/^https?:\/\/www\.geocaching\.com\/profile\/\?id=(\d+)/);
                if (id && id[1]) {
                    var idLink = "/p/default.aspx?id=" + id[1] + "&tab=geocaches";
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: idLink,
                        onload: function(response) {
                            if (response.responseText) {
                                [user, guid] = getUserGuidFromProfile(response.responseText);
                                if (user) {
                                    appendCssStyle(".gclh_vip {margin-left: 8px; margin-right: 4px;}");
                                    var side = document.getElementsByClassName('muted')[0].children[1];
                                    link = gclh_build_vipvup(user, global_vips, "vip");
                                    side.appendChild(link);
                                    if (settings_process_vup && user != global_activ_username) {
                                        link = gclh_build_vipvup(user, global_vups, "vup");
                                        side.appendChild(link);
                                    }
                                }
                            }
                        }
                    });
                }

            // Public Profile:
            // ----------
            } else if (is_page("publicProfile") && $('#ctl00_ContentBody_ProfilePanel1_lblMemberName, #ctl00_ProfileHead_ProfileHeader_lblMemberName')[0]) {
                var user = $('#ctl00_ContentBody_ProfilePanel1_lblMemberName, #ctl00_ProfileHead_ProfileHeader_lblMemberName')[0].innerHTML.replace(/&amp;/, '&');
                var side = $('#ctl00_ContentBody_ProfilePanel1_lblMemberName, #ctl00_ProfileHead_ProfileHeader_lblStatusText')[0];
                // Build VIP Icon.
                link = gclh_build_vipvup(user, global_vips, "vip");
                link.children[0].style.marginLeft = ($('#ctl00_ContentBody_ProfilePanel1_lblMemberName')[0] ? "0" : "14px");
                link.children[0].style.marginRight = "0";
                side.appendChild(document.createTextNode(" "));
                side.appendChild(link);
                // Build VUP Icon.
                if (settings_process_vup && user != global_activ_username) {
                    link = gclh_build_vipvup(user, global_vups, "vup");
                    link.children[0].setAttribute("style", "margin-left: 0px; margin-right: 0px");
                    side.appendChild(document.createTextNode(" "));
                    side.appendChild(link);
                }

            // Nearest lists:
            // ----------
            } else if (document.location.href.match(/\.com\/seek\/nearest\.aspx(.*)(\?ul|\?u|&ul|&u)=/)) {
                var id = "ctl00_ContentBody_LocationPanel1_OriginLabel";
                if (document.getElementById(id)) {
                    appendCssStyle("#"+id+" a img {margin-right: -5px;}");
                    var side = document.getElementById(id);
                    var user = getUrlUser();
                    gclh_build_vipvupmail(side, user);
                }

            // Friend League:
            // ----------
            } else if (document.location.href.match(/\.com\/play\/(friendleague|leaderboard)/)) {
                // Click im Knoten mit Class summary klappt Details auf/zu. Beim Click auf Buttons das verhindern durch temporäre Änderung dieser Class.
                function doNotChangeDetailsByClick() {
                    this.parentNode.parentNode.parentNode.className = "gclh_summary";
                    setTimeout(function() {
                        var s = $('.gclh_summary')[0];
                        if (s) s.className = "summary";
                    }, 100);
                }

                function addVIPVUPLinksToReloadedFriends(table_length, maxwaittime){
                    var leaderboard_table = document.getElementById('LeaderboardTable').getElementsByTagName("table")[0];
                    var new_table_length = $(leaderboard_table).children().length;

                    if(new_table_length > table_length){
                        var side = $('table.leaderboard-table tbody.leaderboard-item .summary .profile-info');
                        var links = $('table.leaderboard-table tbody.leaderboard-item .details .profile-link');
                        if (!side || !links || side.length != links.length) return;
                        for (var i = 0; i < links.length; i++) {
                            if($(side[i]).find('img.gclh_vip').html() != null){
                                // already has VIP/VUP Icons
                                continue;
                            }
                            var span = document.createElement('span');
                            span.setAttribute("style", "min-width: 80px; padding-right: 20px; display: table-cell; vertical-align: middle; box-sizing: unset;");
                            span.addEventListener("click", doNotChangeDetailsByClick, false);
                            side[i].appendChild(span);
                            var last = side[i].children.length - 1;
                            var user = links[i].href.match(/https?:\/\/www\.geocaching\.com\/profile\/\?u=(.*)/);
                            gclh_build_vipvupmail(side[i].children[last], decodeUnicodeURIComponent(user[1]));
                        }

                        table_length = $(leaderboard_table).children().length;

                        var LeaderboardFooter = document.getElementById('LeaderboardFooter');
                        var button = LeaderboardFooter.getElementsByTagName("button")[0];

                        if(button){
                            button.addEventListener("click", function(){
                                addVIPVUPLinksToReloadedFriends(table_length, 10000);
                            }, false);
                        }

                    }else{
                        if(maxwaittime > 0){
                            setTimeout(function(){addVIPVUPLinksToReloadedFriends(table_length,maxwaittime-200);}, 200);
                        }else{
                            console.error("Could not add VIP/VUP Links to newly loaded Leaderboard members. Maximum wait time exeeded.");
                        }
                    }
                }

                function checkLeagueAvailable(waitCount) {
                    if ($('table.leaderboard-table tbody.leaderboard-item').length > 0) {
                        var side = $('table.leaderboard-table tbody.leaderboard-item .summary .profile-info');
                        var links = $('table.leaderboard-table tbody.leaderboard-item .details .profile-link');
                        if (!side || !links || side.length != links.length) return;
                        appendCssStyle(".leaderboard-item .profile-info a {display: table-cell;} .leaderboard-item .profile-info a img {margin-right: 5px;}");
                        for (var i = 0; i < links.length; i++) {
                            var span = document.createElement('span');
                            span.setAttribute("style", "min-width: 80px; padding-right: 20px; display: table-cell; vertical-align: middle; box-sizing: unset;");
                            span.addEventListener("click", doNotChangeDetailsByClick, false);
                            side[i].appendChild(span);
                            var last = side[i].children.length - 1;
                            var user = links[i].href.match(/https?:\/\/www\.geocaching\.com\/profile\/\?u=(.*)/);
                            gclh_build_vipvupmail(side[i].children[last], decodeUnicodeURIComponent(user[1]));
                        }

                        var leaderboard_table = document.getElementById('LeaderboardTable').getElementsByTagName("table")[0];

                        var table_length = $(leaderboard_table).children().length;

                        var LeaderboardFooter = document.getElementById('LeaderboardFooter');
                        var button = LeaderboardFooter.getElementsByTagName("button")[0];

                        if(button){
                            button.addEventListener("click", function(){
                                addVIPVUPLinksToReloadedFriends(table_length, 10000);
                            }, false);
                        }

                    } else {waitCount++; if (waitCount <= 50) setTimeout(function(){checkLeagueAvailable(waitCount);}, 200);}
                }
                checkLeagueAvailable(0);
            }
        }
    } catch(e) {gclh_error("VIP VUP",e);}

// Log-Template (Logtemplate) definieren.
    if (is_page("cache_listing")) {
        try {
            global_MailTemplate = urlencode(buildSendTemplate().replace(/#Receiver#/ig, "__Receiver__"));
            global_MailTemplate = global_MailTemplate.replace(/__Receiver__/ig, "${UserName}");

            var isUpvoteActive = false;
            if($('#cache_logs_container #sortOrder').length) isUpvoteActive = true

            var vupUserString = 'if UserName == "#" ';
            var vupHideAvatarString  = 'if (UserName != "#" ';
            var vupHideCompleteLog = vupUserString;
            if (settings_process_vup && global_vups && global_vups.length > 0) {
                for (var i = 0; i < global_vups.length; i++) {
                    vupUserString += '|| UserName == "' + global_vups[i] + '"';
                    if (settings_vup_hide_avatar) vupHideAvatarString += '&& UserName !== "' + global_vups[i] + '"';
                }
                if (settings_vup_hide_avatar && settings_vup_hide_log) vupHideCompleteLog = vupUserString;
            }
            vupHideAvatarString  += ')';

            var mailNewWin = "";
            if (settings_mail_icon_new_win) mailNewWin = 'target="_blank" ';
            var messageNewWin = "";
            if (settings_message_icon_new_win) messageNewWin = 'target="_blank" ';

            var new_tmpl = "";
            new_tmpl +=
                '{{' + vupHideCompleteLog  + '}}' +
                '<tr class="log-row display_none" data-encoded="${IsEncoded}" style="display:none" >' +
                '{{else}}' +
                '<tr class="log-row l-${LogID}" data-encoded="${IsEncoded}" >' +
                '{{/if}}' +
                '  <td>' +
                '    <div class="FloatLeft LogDisplayLeft" >' +
                '      <p class="logOwnerProfileName">' +
                '        <strong>' +
                '          {{' + vupHideAvatarString  + '}}' +
                '          <a id="${LogID}" name="${LogID}" href="/profile/?guid=${AccountGuid}">${UserName}</a>' +
                '          {{else}}' +
                '          <a id="${LogID}" name="${LogID}" href="/profile/?guid=${AccountGuid}">V.U.P.</a>' +
                '          {{/if}}' +
                '        </strong>' +
                '      </p>' +
                '      <p class="logIcons">' +
                '        <strong>' +
                '          <a class="logOwnerBadge">' +
                '            {{if creator}}<img title="${creator.GroupTitle}" src="${creator.GroupImageUrl}" style="vertical-align: baseline;">{{/if}}</a>';
            if (settings_show_vip_list) new_tmpl +=
                '          <a href="javascript:void(0);" name="${UserName}" class="gclh_vip"><img class="gclh_vip" border=0 style="margin-left: 0px; margin-right: 0px"></a>';
            if (settings_process_vup) new_tmpl +=
                '          {{if UserName !== "' + global_activ_username + '" }}' +
                '          <a href="javascript:void(0);" name="${UserName}" class="gclh_vup"><img class="gclh_vup" border=0 style="margin-left: 0px; margin-right: 0px"></a>' +
                '          {{/if}}';
            if (settings_show_mail) new_tmpl +=
                '          {{if UserName !== "' + global_activ_username + '" }}' +
                '          <a ' + mailNewWin + 'href="/email/?guid=${AccountGuid}&text=' + global_MailTemplate + '"><img border=0 title="Send a mail to ${UserName}" src="' + global_mail_icon + '"></a>' +
                '          {{/if}}';
            if (settings_show_message) new_tmpl +=
                '          {{if UserName !== "' + global_activ_username + '" }}' +
                '          <a ' + messageNewWin + 'href="/account/messagecenter?recipientId=${AccountGuid}&text=' + global_MailTemplate + '"><img border=0 title="Send a message to ${UserName}" src="' + global_message_icon + '"></a>' +
                '          {{/if}}';
            new_tmpl +=
                '          &nbsp;&nbsp;' +
                '          <a title="Top" href="#gclh_top" style="color: #000000; text-decoration: none; float: right; padding-left: 4px;">↑</a>' +
                '        </strong>' +
                '      </p>' +
                '      <p class="logOwnerAvatar">' +
                '        <a href="/profile/?guid=${AccountGuid}">';
            if (!settings_hide_avatar) new_tmpl +=
                '          {{' + vupHideAvatarString  + ' && AvatarImage}}' +
                '          <img width="48" height="48" src="' + http + '://img.geocaching.com/user/avatar/${AvatarImage}">' +
                '          {{else}}' +
                '          <img width="48" height="48" src="/images/default_avatar.jpg">' +
                '          {{/if}}';
            new_tmpl +=
                '      </a></p>' +
                '      <p class="logOwnerStats">' +
                '        {{' + vupHideAvatarString  + ' && (GeocacheFindCount > 0) }}' +
                '        <img title="Caches Found" src="/images/icons/icon_smile.png"> ${GeocacheFindCount}' +
                '        {{/if}}' +
                '      </p>' +
                '    </div>' +
                '    <div class="FloatLeft LogDisplayRight">' +
                '      <div class="HalfLeft LogType">' +
                '         <strong>' +
                '           <img title="${LogType}" alt="${LogType}" src="/images/logtypes/${LogTypeImage}">&nbsp;${LogType}</strong><small class="gclh_logCounter"></small></div>' +
                '      <div class="HalfRight AlignRight">' +
                '        <span class="minorDetails LogDate">${Visited}</span></div>' +
                '      <div class="Clear LogContent markdown-output">' +
                '        {{if LatLonString.length > 0}}' +
                '        <strong>${LatLonString}</strong>' +
                '        {{/if}}' +
                '        {{' + vupUserString + '}}' +
                '        <p class="LogText">censored</p>' +
                '        {{else}}' +
                '        <p class="LogText">{{html LogText}}</p>' +
                '        {{/if}}';
            if (settings_show_thumbnails) new_tmpl +=
                '      </div>' +
                '      {{if Images.length > 0}}' +
                '      <div class="TableLogContent">' +
                '        <table cellspacing="0" cellpadding="3" class="LogImagesTable">' +
                '          <tr><td>' +
                '            {{tmpl(Images) "tmplCacheLogImages"}}' +
                '          </td></tr>' +
                '        </table>' +
                '      </div>' +
                '      {{/if}}';
            else new_tmpl +=
                '        {{if Images.length > 0}}' +
                '        <ul class="LogImagesTable">' +
                '          {{tmpl(Images) "tmplCacheLogImages"}}' +
                '        </ul>' +
                '        {{/if}}' +
                '      </div>';
            new_tmpl +=
                '      <div class="AlignRight">' +
                '        <small><a title="View Log" href="/seek/log.aspx?LUID=${LogGuid}" target="_blank">' +
                '        {{if (userInfo.ID==AccountID)}}' +
                '        View / Edit Log / Images' +
                '        {{else}}' +
                '        View Log' +
                '        {{/if}}' +
                '        </a></small>&nbsp;' +
                '        {{if (userInfo.ID==AccountID)}}' +
                '        <small><a title="Upload Image" href="/seek/upload.aspx?LID=${LogID}" target="_blank">Upload Image</a></small>' +
                '        {{/if}}' +
                '      </div>';
            if(isUpvoteActive) new_tmpl +=
                '     {{if LogType === "Found it" || LogType === "Didn\'t find it" || LogType === "Webcam photo taken" || LogType === "Attended" || LogType === "Announcement" }}' +
                '         <div class="upvotes">' +
                '             <button class="great-story-btn{{if (typeof greatStoryupvotedByUser != "undefined") && greatStoryupvotedByUser}} upvoted{{/if}}"' +
                '                     type="button" ' +
                '                     data-log-id="${LogID}" ' +
                '                     data-upvoted="false" ' +
                '                     data-upvote-type="1" ' +
                '                     {{if userInfo.ID == AccountID}}' +
                '                         title="You cannot vote for your own logs."' +
                '                     {{else}}' +
                '                         title="Was this a great story?"' +
                '                     {{/if}}' +
                '                     {{if userInfo.ID == AccountID}}disabled{{/if}}>                ' +
                '                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
                '                   <g>' +
                '                     <g stroke-width="1.125" transform="translate(4 3)">' +
                '                       <path d="M2,0 L16,0 L16,18 L2,18 L2,18 C0.8954305,18 1.3527075e-16,17.1045695 0,16 L0,2 L0,2 C-1.3527075e-16,0.8954305 0.8954305,2.02906125e-16 2,0 Z"/>' +
                '                       <path d="M4.5,0.5 L4.5,17.5" stroke-linecap="square"/>' +
                '                       <polygon points="9 0 13 0 13 8 11 6 9 8"/>' +
                '                     </g>' +
                '                   </g>' +
                '                 </svg>' +
                '                 <span>Great story{{if (typeof greatStory != "undefined") && greatStory > 0}} (${greatStory}){{/if}}</span>' +
                '             </button>' +
                '             <span class="loading-container hide loading-${LogID}">' +
                '                 <img src="/app/ui-images/branding/loading-spinner.svg"></img>' +
                '             </span>' +
                '             <button class="helpful-btn{{if (typeof helpfulupvotedByUser != "undefined") && helpfulupvotedByUser}} upvoted{{/if}}" ' +
                '                     type="button" data-log-id="${LogID}"' +
                '                     data-upvoted="false" ' +
                '                     data-upvote-type="2" ' +
                '                     {{if userInfo.ID == AccountID}}' +
                '                         title="You cannot vote for your own logs."' +
                '                     {{else}}' +
                '                         title="Was this helpful?"' +
                '                     {{/if}}' +
                '                     {{if userInfo.ID == AccountID}}disabled{{/if}}>' +
                '                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 21.55 21.29">' +
                '                   <g>' +
                '                     <g>' +
                '                       <path d="M21.3 13.38a1.08 1.08 0 0 1-.18.6 1 1 0 0 1-1.41.34l-1.29-.89-2.33-1.55-.15.21 3.63 2.43a1.12 1.12 0 0 1 .29 1.48 1.1 1.1 0 0 1-.7.47 1 1 0 0 1-.78-.17l-3.69-2.47-.14.19 3.81 2.59a1.1 1.1 0 0 1 .29 1.51 1 1 0 0 1-1.42.32L13.3 15.8l-.14.2L17 18.58a.48.48 0 0 1 .11.09 1.08 1.08 0 0 1 .17 1.42 1 1 0 0 1-.67.46 1 1 0 0 1-.8-.16l-1.43-1a1.84 1.84 0 0 0-.8-1.39 1.77 1.77 0 0 0-1-.31 1.84 1.84 0 0 0-.33 0 1.67 1.67 0 0 0-.3.08 1.83 1.83 0 0 0-.74-1.88 1.77 1.77 0 0 0-1-.3 1.5 1.5 0 0 0-.35 0 1.58 1.58 0 0 0-.31.09 1.77 1.77 0 0 0-1.73-2.19h-.33a1.7 1.7 0 0 0-.45.15 1.7 1.7 0 0 0-.66-1.83 1.58 1.58 0 0 0-.91-.28 1.35 1.35 0 0 0-.33 0 1.67 1.67 0 0 0-1.06.71l-.3.46a5.17 5.17 0 0 1-.43-2.13L0 8.31 4.92.9l3.32 2.31A2.67 2.67 0 0 1 11.52 3a4.19 4.19 0 0 0-2.75 1.16C7.79 5.33 6.17 7.79 6.05 8H6v.06a2 2 0 0 0 .3 1.68 1.07 1.07 0 0 0 .42.33 1.62 1.62 0 0 0 .72.17 1.54 1.54 0 0 0 1.09-.45l1.31-2a2.44 2.44 0 0 0 1.49.63 2 2 0 0 0 .42 0 2.12 2.12 0 0 0 .67-.3 2.61 2.61 0 0 0 .78-.7l6.58 4.41 1 .65a1.09 1.09 0 0 1 .45.69.82.82 0 0 1 .07.21z"/>' +
                '                       <path d="M9.23 15.31a1 1 0 0 1 0 .17.8.8 0 0 1 0 .15 1.33 1.33 0 0 1 0 .19l-.15.18a1.09 1.09 0 0 1-.08.15l-.16.24L8 17.55a1.43 1.43 0 0 1-.2.23 1.43 1.43 0 0 1-.7.36 1.23 1.23 0 0 1-.27 0 1.42 1.42 0 0 1-.8-.24 1.49 1.49 0 0 1-.5-1.8 1.74 1.74 0 0 1 .1-.19l1-1.44a1.43 1.43 0 0 1 .89-.57 1.23 1.23 0 0 1 .27 0 1.44 1.44 0 0 1 .8.24 1.55 1.55 0 0 1 .27.24 1.32 1.32 0 0 1 .19.29 2.19 2.19 0 0 1 .12.33 1.39 1.39 0 0 1 .06.31zM11.58 17.75a2.33 2.33 0 0 1-.14.33.34.34 0 0 1-.06.12l-.75 1.14a1 1 0 0 1-.13.16 1.38 1.38 0 0 1-.79.45 1.14 1.14 0 0 1-.26 0 1.38 1.38 0 0 1-.8-.25 1.47 1.47 0 0 1-.53-1.7 1.22 1.22 0 0 1 .14-.28L9 16.56a1.48 1.48 0 0 1 .33-.33 1.33 1.33 0 0 1 .6-.23 1.23 1.23 0 0 1 .27 0 1.41 1.41 0 0 1 .79.24 1.48 1.48 0 0 1 .59 1.51zM13.76 20.3l-.37.55a1.29 1.29 0 0 1-1.13.44 5 5 0 0 1-.88-.09 1.48 1.48 0 0 1-.55-1.56.27.27 0 0 0 .09-.1l.75-1.14.05-.08.08-.07a1.26 1.26 0 0 1 .26-.13 1.05 1.05 0 0 1 .24-.06 1.06 1.06 0 0 1 .25 0A1.41 1.41 0 0 1 14 19.15a1.48 1.48 0 0 1-.24 1.15zM11.8 18.24l-.08.07z"/>' +
                '                       <path d="M11.72 18.3l.08-.07z" />' +
                '                       <path d="M20.05 9.92a2.33 2.33 0 0 1-.19 1.44l-6.68-4.48-.06.12a2.34 2.34 0 0 1-.92.85 2 2 0 0 1-.48.19 1.24 1.24 0 0 1-.33 0A2.15 2.15 0 0 1 10 7.36l-.11-.12L8.3 9.57a1.22 1.22 0 0 1-.85.35 1.17 1.17 0 0 1-.57-.14.83.83 0 0 1-.31-.24 1.17 1.17 0 0 1-.23-.44 2.21 2.21 0 0 1 0-.93C6.5 7.93 8.09 5.52 9 4.39a4 4 0 0 1 2.71-1h.54L14.53 0l7 4.93-2.17 3.33v.07a5.38 5.38 0 0 1 .69 1.59zM6.52 14l-.13.2v.06l-1 1.45a1.36 1.36 0 0 1-.84.55 1 1 0 0 1-.24 0 1.26 1.26 0 0 1-.73-.23 1.37 1.37 0 0 1-.35-1.84l1.14-1.71a1.33 1.33 0 0 1 .84-.48 1.06 1.06 0 0 1 .25 0 1.22 1.22 0 0 1 .71.22A1.37 1.37 0 0 1 6.52 14z"/>' +
                '                     </g>' +
                '                   </g>' +
                '                 </svg>' +
                '                 <span>Helpful{{if (typeof helpful != "undefined") && helpful > 0}} (${helpful}){{/if}}</span>' +
                '             </button>' +
                '         </div>' +
                '     {{/if}}';
            new_tmpl +=
                '     </div>' +
                '   </td>' +
                '</tr>';

            var css = "";
            // Log Text und User Bereich noch etwas ausrichten, keinen Platz in der Höhe verlieren.
            css += ".LogDisplayRight .LogText {min-height: unset; padding-top: 0; margin-bottom: 8px;}";
            css += ".logOwnerProfileName {padding-top: 0; margin-bottom: 8px;} .logIcons, .logOwnerAvatar {margin-bottom: 4px;}";
            css += ".markdown-output {margin: unset;}";
            if (!settings_hide_avatar) css += ".markdown-output {min-height: 6em;}";
            // Bilderrahmen im Log noch etwas ausrichten und Trenner von Text und User auch hier einbauen.
            css += ".TableLogContent {padding-left: 0.5em; border-left: 1px solid #d7d7d7;}";
            // Länge der Usernamen in den Logs beschränken, damit sie nicht umgebrochen werden.
            css += ".logOwnerProfileName {max-width: 135px; display: inline-block; overflow: hidden; vertical-align: bottom; white-space: nowrap; text-overflow: ellipsis;}";

            if(isUpvoteActive) css += ".upvotes{display: block;}";

            appendCssStyle(css);
        } catch(e) {gclh_error("Define log-template",e);}
    }

// Overwrite Log-Template (Logtemplate) and Log-Load-Function. (Muß unbedingt nach VIP laufen.)
    overwrite_log_template:
    if (settings_load_logs_with_gclh && is_page("cache_listing") && !document.getElementById("ctl00_divNotSignedIn") && document.getElementById('tmpl_CacheLogRow') && document.getElementById("cache_logs_table")) {
        try {
            // IDs der Cache Logs Tables.
            var logsTab = '#cache_logs_table2, #cache_logs_table';
            // To Top Link.
            var a = document.createElement("a");
            a.setAttribute("href", "#");
            a.setAttribute("name", "gclh_top");
            $('body')[0].insertBefore(a, $('body')[0].childNodes[0]);
            var new_tmpl_block = document.createElement("script");
            new_tmpl_block.type = "text/x-jquery-tmpl";
            new_tmpl_block.innerHTML = new_tmpl;
            new_tmpl_block.setAttribute("id", "tmpl_CacheLogRow_gclh");
            $('body')[0].appendChild(new_tmpl_block);

            // Override standard templates.
            document.getElementById('tmpl_CacheLogRow').innerHTML = new_tmpl;
            var elem = unsafeWindow.$('#tmpl_CacheLogRow')[0];
            unsafeWindow.$.removeData(elem, "tmpl");
            unsafeWindow.$("#tmpl_CacheLogRow").template("tmplCacheLogRow");
            if (browser === "chrome" || browser === "firefox") {
                injectPageScriptFunction(function() {
                    var elem = window.$('#tmpl_CacheLogRow')[0];
                    window.$.removeData(elem, "tmpl");
                    window.$("#tmpl_CacheLogRow").template("tmplCacheLogRow");
                }, "()");
            }

            // Reinit initalLogs.
            // Timeout is necessary because otherwise the fancybox for images is not working (WTF??)
            setTimeout(function(){
                // Remove all logs
                unsafeWindow.$("#cache_logs_table tbody").children().remove();

                var initialLogs = unsafeWindow.initialLogs;
                var inclAvatars = chromeUserData.includeAvatars || unsafeWindow.includeAvatars || includeAvatars;

                for (var i = 0; i < initialLogs.data.length; i++) {
                    var newBody = unsafeWindow.$(document.createElement("TBODY"));
                    unsafeWindow.$("#tmpl_CacheLogRow_gclh").tmpl(initialLogs.data[i]).appendTo(newBody);
                    unsafeWindow.$(document.getElementById("cache_logs_table")).append(newBody.children());
                }

                unsafeWindow.$('a.tb_images').fancybox({'type': 'image', 'titlePosition': 'inside'});
                gclh_add_vip_icon();
                setLinesColorInCacheListing();
            }, 0);

            if (settings_hide_found_count){
                var css = "#cache_logs_container .logOwnerStats"
                        + "{display:none;}";
                appendCssStyle(css);
            }

            function loadListener(e) {
                gclh_add_vip_icon();
                setLinesColorInCacheListing();
            }
            (document.getElementById("cache_logs_table2") || document.getElementById("cache_logs_table")).addEventListener('DOMNodeInserted', loadListener);
            if (isTM === false) {
                window.addEventListener("message", function(ev) {
                    if (ev.origin !== "https://www.geocaching.com" && ev.origin !== "https://www.geocaching.com") return;
                    if (ev.data === "gclh_add_vip_icon") gclh_add_vip_icon();
                    if (ev.data === "setLinesColorInCacheListing") setLinesColorInCacheListing();
                });
            }
            function disablePageAutoScroll() {
                var unsafeWindow = (typeof(unsafeWindow) == "undefined" ? window : unsafeWindow);
                unsafeWindow.currentPageIdx = 2;
                unsafeWindow.totalPages = 1;
                unsafeWindow.isBusy = true;
                unsafeWindow.initalLogs = initalLogs = {
                    "status": "success",
                    "data": [],
                    "pageInfo": {"idx": 2, "size": 0, "totalRows": 1, "totalPages": 1, "rows": 1}
                };
            }

            // Build VIP Icons.
            function gclh_add_vip_icon() {
                var elements = $(document.getElementById("cache_logs_table2") || document.getElementById("cache_logs_table")).find("a.gclh_vip").not(".gclh_vip_hasIcon");
                for (var i = 0; i < elements.length; i++) {
                    var link = elements[i];
                    link = gclh_build_vipvup(link.name, global_vips, "vip", link);  // Ist oben bei VIP. VUP.
                    unsafeWindow.$(link).addClass("gclh_vip_hasIcon");
                }
                if (settings_process_vup) gclh_add_vup_icon();
            }
            // Build VUP Icons.
            function gclh_add_vup_icon() {
                var elements = $(document.getElementById("cache_logs_table2") || document.getElementById("cache_logs_table")).find("a.gclh_vup").not(".gclh_vup_hasIcon");
                for (var i = 0; i < elements.length; i++) {
                    var link = elements[i];
                    link = gclh_build_vipvup(link.name, global_vups, "vup", link);  // Ist oben bei VIP. VUP.
                    unsafeWindow.$(link).addClass("gclh_vup_hasIcon");
                }
            }

            var lastFired = 0;
            var global_logs = false;
            var global_num = 0;

            // Dynamic load with full control.
            function gclh_dynamic_load(logs, num) {
                if (lastFired == 0 && !global_logs) {
                    // First run, so we set the global logs/num and add the Event listener
                    global_logs = logs;
                    global_num = num;
                    window.addEventListener("scroll", function (event) {
                        gclh_dynamic_load();
                        event.stopPropagation();
                    }, true);
                }
                var currentTime = + new Date();
                if ((currentTime - lastFired) > 500) {
                    // Fire every 500ms at maximum
                    lastFired = + new Date();

                    var isBusy = false;
                    var startReloadAtThisPixel = (($(document).height() - $("#cache_logs_container").offset().top) + 50)
                    var currentPosition = $(this).scrollTop();

                    if (currentPosition > startReloadAtThisPixel) {
                        if (!isBusy && !document.getElementById("gclh_all_logs_marker")) {
                            isBusy = true;
                            $("#pnlLazyLoad").show();
                            var log_ids = [];
                            for (var i = 0; i < 10; i++) {
                                if (global_logs[global_num]) {
                                    log_ids.push(global_logs[global_num].LogID);
                                    var newBody = unsafeWindow.$(document.createElement("TBODY"));
                                    unsafeWindow.$("#tmpl_CacheLogRow_gclh").tmpl(global_logs[global_num]).appendTo(newBody);
                                    unsafeWindow.$(document.getElementById("cache_logs_table2") || document.getElementById("cache_logs_table")).append(newBody.children());
                                }
                                global_num++;  // Num kommt vom vorherigen laden "aller" logs.
                            }
                            unsafeWindow.$('a.tb_images').fancybox({'type': 'image', 'titlePosition': 'inside'});
                            gclh_add_vip_icon();
                            setLinesColorInCacheListing();
                            if(isUpvoteActive){
                                unsafeWindow.appendUpvotesToLogs(log_ids);
                                updateUpvoteEvents(logs);
                            }
                            if (!settings_hide_top_button) $("#topScroll").fadeIn();
                            $("#pnlLazyLoad").hide();
                            isBusy = false;
                        }
                    }
                }
            }

            // Load all logs.
            function gclh_load_all(logs) {
                function gclh_load_all_logs() {
                    $('#gclh_load_all_logs').addClass("working");
                    setTimeout(function() {
                        if (logs) {
                            $(logsTab).find('tbody').children().remove();
                            for (var i = 0; i < logs.length; i++) {
                                if (logs[i]) {
                                    var newBody = unsafeWindow.$(document.createElement("TBODY"));
                                    unsafeWindow.$("#tmpl_CacheLogRow_gclh").tmpl(logs[i]).appendTo(newBody);
                                    unsafeWindow.$(document.getElementById("cache_logs_table2") || document.getElementById("cache_logs_table")).append(newBody.children());
                                }
                            }
                            unsafeWindow.$('a.tb_images').fancybox({'type': 'image', 'titlePosition': 'inside'});
                            gclh_add_vip_icon();
                            setLinesColorInCacheListing();
                            setMarkerDisableDynamicLogLoad();
                            if (document.getElementById("gclh_show_log_counter")) document.getElementById("gclh_show_log_counter").style.visibility = "";
                        }
                        $('#gclh_load_all_logs').removeClass("working");
                    }, 100);
                }
                var para = document.getElementById('ctl00_ContentBody_lblFindCounts').nextSibling.nextSibling.nextSibling.nextSibling;
                if (para && para.nodeName == 'P') para.className = para.className + ' Clear';
                if (settings_show_all_logs_but) addButtonOverLogs(gclh_load_all_logs, "gclh_load_all_logs", false, "Show all logs", "");
                if (settings_show_bigger_avatars_but && !settings_hide_avatar && !isMemberInPmoCache() && settings_show_thumbnails) showBiggerAvatarsLink();
                if (settings_show_log_counter_but) showLogCounterLink();
                if(isUpvoteActive){
                    $('#new_sort_element_upvote').prop( "disabled", false );
                    $('#new_sort_element_upvote').removeClass("isDisabled");
                }

                if (settings_show_compact_logbook_but){
                    addButtonOverLogs(toggle_compact_logbook, "toggle_compact_logbook", false, "Show compact logs", "Show/hide compact logs");
                    var unimportant_css =
                              ".compact_logbook .logIcons,"
                            + ".compact_logbook .logOwnerAvatar,"
                            + ".compact_logbook .logOwnerStats,"
                            + ".compact_logbook .LogContent,"
                            + ".compact_logbook .TableLogContent,"
                            + ".compact_logbook .upvotes,"
                            + ".compact_logbook .AlignRight small"
                            + "{display:none;}";
                    appendCssStyle(unimportant_css);
                }
            }

            // Filter logs.
            function gclh_filter(logs) {
                function gclh_filter_logs() {
                    if (!this.childNodes[0]) return false;
                    var log_type = this.childNodes[0].title;
                    if (!log_type) return false;
                    if (log_type.match(/VIP/)) log_type = "VIP";
                    if (this.name && this.name == "vip_list") {
                        document.getElementById("ctl00_ContentBody_lblFindCounts").scrollIntoView();
                        window.scrollBy(0, -30);
                    }
                    if (settings_show_owner_vip_list) var vip_owner = get_real_owner();
                    else var vip_owner = "#";
                    if (!logs) return false;
                    $(logsTab).find('tbody').children().remove();
                    for (var i = 0; i < logs.length; i++) {
                        if (logs[i] && (logs[i].LogType == log_type || (log_type == "VIP" && (in_array(logs[i].UserName, global_vips) || logs[i].UserName == vip_owner)))) {
                            var newBody = unsafeWindow.$(document.createElement("TBODY"));
                            unsafeWindow.$("#tmpl_CacheLogRow_gclh").tmpl(logs[i]).appendTo(newBody);
                            unsafeWindow.$(document.getElementById("cache_logs_table2") || document.getElementById("cache_logs_table")).append(newBody.children());
                        }
                    }
                    unsafeWindow.$('a.tb_images').fancybox({'type': 'image', 'titlePosition': 'inside'});
                    gclh_add_vip_icon();
                    setLinesColorInCacheListing();
                    setMarkerDisableDynamicLogLoad();
                    if (document.getElementById("gclh_show_log_counter")) document.getElementById("gclh_show_log_counter").style.visibility = "hidden";
                }
                if (!document.getElementById("ctl00_ContentBody_lblFindCounts").childNodes[0]) return false;
                var legend = document.getElementById("ctl00_ContentBody_lblFindCounts").childNodes[0];
                var new_legend = document.createElement("p");
                new_legend.className = "LogTotals";
                for (var i = 0; i < legend.childNodes.length; i++) {
                    if (legend.childNodes[i].tagName == "IMG") {
                        var link = document.createElement("a");
                        link.setAttribute("href", "javascript:void(0);");
                        link.style.textDecoration = 'none';
                        link.addEventListener("click", gclh_filter_logs, false);
                        link.appendChild(legend.childNodes[i].cloneNode(true));
                        i++;
                        link.appendChild(legend.childNodes[i].cloneNode(true));
                        new_legend.appendChild(link);
                    }
                }
                if (settings_show_vip_list) {
                    var link = document.createElement("a");
                    link.setAttribute("href", "javascript:void(0);");
                    link.setAttribute("style", "text-decoration: 'none'; padding-right: 18px;");
                    link.setAttribute("name", "logs");
                    link.addEventListener("click", gclh_filter_logs, false);
                    var img = document.createElement("img");
                    img.setAttribute("src", global_logs_vip_icon);
                    img.setAttribute("title", "VIP logs");
                    link.appendChild(img);
                    new_legend.appendChild(link);
                }
                document.getElementById('ctl00_ContentBody_lblFindCounts').replaceChild(new_legend, legend);
                if (document.getElementById("lnk_gclh_vip_list")) {
                    var side = document.getElementById("lnk_gclh_vip_list").parentNode;
                    var link = document.createElement("a");
                    link.setAttribute("href", "javascript:void(0);");
                    link.setAttribute("style", "padding-left: 12px;");
                    link.setAttribute("name", "vip_list");
                    link.addEventListener("click", gclh_filter_logs, false);
                    var img = document.createElement("img");
                    img.setAttribute("src", global_logs_vip_icon);
                    img.setAttribute("style", "margin-bottom: -2px;");
                    img.setAttribute("title", "VIP logs");
                    link.appendChild(img);
                    side.appendChild(link);
                }
            }

            // Search logs.
            function gclh_search(logs) {
                function gclh_search_logs(e) {
                    if (e.keyCode != 13  || noSpecialKey(e) == false) return false;
                    if (!logs) return false;
                    var search_text = this.value;
                    if (!search_text) return false;
                    var regexp = new RegExp("(" + search_text + ")", "i");
                    $(logsTab).find('tbody').children().remove();
                    for (var i = 0; i < logs.length; i++) {
                        if (logs[i] && (logs[i].UserName.match(regexp) || logs[i].LogText.match(regexp))) {
                            var newBody = unsafeWindow.$(document.createElement("TBODY"));
                            unsafeWindow.$("#tmpl_CacheLogRow_gclh").tmpl(logs[i]).appendTo(newBody);
                            unsafeWindow.$(document.getElementById("cache_logs_table2") || document.getElementById("cache_logs_table")).append(newBody.children());
                        }
                    }
                    unsafeWindow.$('a.tb_images').fancybox({'type': 'image', 'titlePosition': 'inside'});
                    gclh_add_vip_icon();
                    setLinesColorInCacheListing();
                    setMarkerDisableDynamicLogLoad();
                    if (document.getElementById("gclh_show_log_counter")) document.getElementById("gclh_show_log_counter").style.visibility = "hidden";
                }
                if (!document.getElementById("ctl00_ContentBody_lblFindCounts").childNodes[0]) return false;
                var form = document.createElement("form");
                var search = document.createElement("input");
                form.setAttribute("action", "javascript:void(0);");
                form.appendChild(search);
                form.style.display = "inline";
                search.setAttribute("type", "text");
                search.setAttribute("size", "10");
                search.addEventListener("keyup", gclh_search_logs, false);
                document.getElementById('ctl00_ContentBody_lblFindCounts').childNodes[0].appendChild(document.createTextNode("Search in logtext: "));
                document.getElementById('ctl00_ContentBody_lblFindCounts').childNodes[0].appendChild(form);
            }

            // Marker to disable dynamic log load.
            function setMarkerDisableDynamicLogLoad() {
                var marker = document.createElement("a");
                marker.setAttribute("id", "gclh_all_logs_marker");
                document.getElementsByTagName("body")[0].appendChild(marker);
                $("#pnlLazyLoad").hide();
            }

            // Load "num" Logs.
            function gclh_load_logs(num) {
                var data = new Array();
                var requestCount = 1;
                var logs = new Array();
                var numPages = 1;
                var curIdx = 1;
                if (document.getElementById("gclh_vip_list")) {
                    var span_loading = document.createElement("span");
                    span_loading.innerHTML = '<img src="/images/loading2.gif" class="StatusIcon" alt="Loading" />Loading Cache Logs...';
                    document.getElementById("gclh_vip_list").appendChild(span_loading);
                }
                if (document.getElementById("gclh_vip_list_nofound")) {
                    var span_loading = document.createElement("span");
                    span_loading.innerHTML = '<img src="/images/loading2.gif" class="StatusIcon" alt="Loading" />Loading Cache Logs...';
                    document.getElementById("gclh_vip_list_nofound").appendChild(span_loading);
                }

                if(isUpvoteActive){
                    // remove the sorting select

                    appendCssStyle("#new_sort_element_upvote.isDisabled{opacity: 0.5;}")
                    appendCssStyle("#gclh_show_log_counter.isDisabled{opacity: 0.5;}")

                    var new_sort_element = document.createElement('select');
                    new_sort_element.setAttribute('id', 'new_sort_element_upvote');
                    new_sort_element.classList.add("isDisabled");;
                    new_sort_element.disabled = true;
                    new_sort_element.onchange = function() {

                        var sorting_key = this.value;

                        // Deactivate gclh_show_log_counter_button when sorting is not "newest"
                        var gclh_show_log_counter_button = $("#gclh_show_log_counter input")[0];
                        if(gclh_show_log_counter_button){
                            if(sorting_key == 'newest'){
                                $("#gclh_show_log_counter").removeClass("isDisabled");
                                gclh_show_log_counter_button.disabled = false;
                            }else{
                                $("#gclh_show_log_counter").addClass("isDisabled");
                                gclh_show_log_counter_button.disabled = true;
                            }
                        }

                        $(this).after(' <img id="sort_logs_working" src="' + urlImages + 'ajax-loader.gif" />');

                        //Sort all the logs
                        logs.sort(function(a, b) {
                            if((sorting_key == 'newest') || (b[sorting_key] == a[sorting_key])){
                                return a['newest'] - b['newest'];
                            }else{
                                return b[sorting_key] - a[sorting_key];
                            }
                        });

                        setTimeout(function() {
                            if (logs) {
                                // IDs der Cache Logs Tables.

                                var count = $('tbody',$('#cache_logs_table2, #cache_logs_table')).first().children().length;

                                $('tbody',$('#cache_logs_table2, #cache_logs_table')).first().children().remove();
                                for (var i = 0; i < count; i++) {
                                    if (logs[i]) {
                                        var newBody = unsafeWindow.$(document.createElement("TBODY"));
                                        unsafeWindow.$("#tmpl_CacheLogRow_gclh").tmpl(logs[i]).appendTo(newBody);
                                        unsafeWindow.$(document.getElementById("cache_logs_table2") || document.getElementById("cache_logs_table")).append(newBody.children());
                                    }
                                }
                                unsafeWindow.$('a.tb_images').fancybox({'type': 'image', 'titlePosition': 'inside'});
                                gclh_add_vip_icon();
                                setLinesColorInCacheListing();
                                if (document.getElementById("gclh_show_log_counter")) document.getElementById("gclh_show_log_counter").style.visibility = "";

                                updateUpvoteEvents(logs);
                            }
                            $('#sort_logs_working').remove();
                        }, 100);
                    }

                    var newest = document.createElement('option');
                    newest.innerHTML = 'Newest';
                    newest.value = 'newest';
                    new_sort_element.appendChild(newest);

                    var beststory = document.createElement('option');
                    beststory.innerHTML = 'Best story';
                    beststory.value = 'greatStory';
                    new_sort_element.appendChild(beststory);

                    var mosthelpful = document.createElement('option');
                    mosthelpful.innerHTML = 'Most helpful';
                    mosthelpful.value = 'helpful';
                    new_sort_element.appendChild(mosthelpful);

                    $("#cache_logs_container #sortOrder").before(new_sort_element);
                    $('#cache_logs_container #sortOrder').remove();
                }

                function gclh_load_helper(count) {
                    var url = http + "://www.geocaching.com/seek/geocache.logbook?tkn=" + userToken + "&idx=" + curIdx + "&num=100&decrypt=false";
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: url,
                        onload: function(response) {
                            requestCount--;
                            var dataElement = JSON.parse(response.responseText);
                            data[dataElement.pageInfo.idx] = dataElement;
                            if (numPages == 1) {
                                numPages = data[count].pageInfo.totalPages;
                                for (curIdx = 2; curIdx <= numPages; curIdx++) {
                                    requestCount++;
                                    gclh_load_helper(curIdx);
                                }
                            }
                            if (requestCount <= 0) gclh_load_dataHelper();
                        }
                    });
                }

                function getUpvoteData(logIds,starting_index) {
                    $.ajax({
                        type: "GET",
                        url: "/account/oauth/token",
                        success: function (result) {
                            $.ajax({
                                type: "GET",
                                url: "/api/proxy/web/v1/Geocaches/logs/upvote",
                                dataType: 'json',
                                headers: {
                                    "Authorization": "Bearer " + result.access_token
                                },
                                data: {
                                    geocacheLogIds: logIds.join(',')
                                },
                                success: function (data) {
                                    for (var i = 0; i < logIds.length; i++) {
                                        // Append Great Story and Helpful to our loaded logs
                                        logs[i+starting_index].greatStory = data[logIds[i]].greatStory.count;
                                        logs[i+starting_index].greatStoryupvotedByUser = data[logIds[i]].greatStory.upvotedByUser;
                                        logs[i+starting_index].helpful = data[logIds[i]].helpful.count;
                                        logs[i+starting_index].helpfulupvotedByUser = data[logIds[i]].helpful.upvotedByUser;
                                        logs[i+starting_index].newest = i+starting_index;
                                    }
                                }
                            });
                        }
                    });
                }

                function gclh_load_dataHelper() {
                    logs = new Array();
                    // Disable scroll Function on Page.
                    if (browser === "chrome" || browser === "firefox") injectPageScriptFunction(disablePageAutoScroll, "()");
                    else disablePageAutoScroll();
                    if (isTM === true) (document.getElementById("cache_logs_table2") || document.getElementById("cache_logs_table")).removeEventListener('DOMNodeInserted', loadListener);
                    // Hide initial Logs.
                    var tbodys = document.getElementById("cache_logs_table").getElementsByTagName("tbody");
                    if (tbodys.length > 0) {
                        var shownLogs = tbodys[0].children.length;
                        if (shownLogs > 0 && num < shownLogs) num = shownLogs;
                    }
                    var tableContent = unsafeWindow.$("#cache_logs_table").after('<table id="cache_logs_table2" class="LogsTable NoBottomSpacing"> </table>').hide().children().remove();
                    unsafeWindow.$(tableContent).find('tbody').children().remove();
                    unsafeWindow.$('#cache_logs_table2').append(tableContent);
                    $(tableContent).find('.log-row').remove();
                    for (var z = 1; z <= numPages; z++) {
                        var all_ids = new Array();
                        var json = data[z];
                        logs = logs.concat(json.data);
                        for (var i = 0; i < json.data.length; i++) {
                            var user = json.data[i].UserName;
                            all_ids.push(json.data[i].LogID);
                            if (settings_show_vip_list) {
                                all_users.push(user);
                                if (!log_infos[user]) log_infos[user] = new Array();
                                log_infos[user][index] = new Object();
                                log_infos[user][index]["icon"] = "/images/logtypes/" + json.data[i].LogTypeImage;
                                log_infos[user][index]["id"] = json.data[i].LogID;
                                log_infos[user][index]["date"] = json.data[i].Visited;
                                log_infos[user][index]["log"] = json.data[i].LogText;
                                log_infos[user][index]["membership_level"] = json.data[i].creator.GroupTitle;
                                log_infos_long[index] = new Object();
                                log_infos_long[index]["user"] = user;
                                log_infos_long[index]["icon"] = "/images/logtypes/" + json.data[i].LogTypeImage;
                                log_infos_long[index]["id"] = json.data[i].LogID;
                                log_infos_long[index]["date"] = json.data[i].Visited;
                                log_infos_long[index]["log"] = json.data[i].LogText;
                                log_infos_long[index]["membership_level"] = json.data[i].creator.GroupTitle;

                                if(json.data[i].LogType == "Publish Listing"){
                                    log_infos[user][index]["membership_level"] = "Reviewer";
                                    log_infos_long[index]["membership_level"] = "Reviewer";
                                }

                                index++;
                            }
                        }
                        // Add Great story / helpful data to logs
                        // give starting index to the function, so it knows
                        // what index has to be updated
                        if(isUpvoteActive){
                            getUpvoteData(all_ids,((z-1)*100));
                        }
                    }

                    // Add Links
                    gclh_load_all(logs);
                    gclh_filter(logs);
                    gclh_search(logs);

                    var log_ids = [];

                    for (var i = 0; i < num; i++) {
                        if (logs[i]) {
                            log_ids.push(logs[i].LogID);
                            var newBody = unsafeWindow.$(document.createElement("TBODY"));
                            unsafeWindow.$("#tmpl_CacheLogRow_gclh").tmpl(logs[i]).appendTo(newBody);
                            unsafeWindow.$(document.getElementById("cache_logs_table2") || document.getElementById("cache_logs_table")).append(newBody.children());
                        }
                    }
                    unsafeWindow.$('a.tb_images').fancybox({'type': 'image', 'titlePosition': 'inside'});
                    if(isUpvoteActive){
                        unsafeWindow.appendUpvotesToLogs(log_ids);
                        updateUpvoteEvents(logs);
                    }

                    gclh_dynamic_load(logs, num);
                    if (settings_show_vip_list) {
                        gclh_build_vip_list();
                        gclh_add_vip_icon();
                    }
                    setLinesColorInCacheListing();
                }
                gclh_load_helper(1);
            }

            function updateUpvoteEvents(all_logs){
                $('.great-story-btn').each(function(){
                    $(this).unbind('click');
                    $(this).click(function(){

                        // there is a bug (or a feature) in jQuery(?):
                        // if you have a data attribute (like data-upvoted="false") and you also have set objekt.data(upvoted,"true")
                        // JQuery will override your data value with the data value from the dom. So we check here, if the button has
                        // a class "upvoted", and if yes, we reset the object.data("upvoted") to true. Otherwise, when the button is
                        // upvoted, the first click would not result in "not upvoting" the log, but the secound.
                        if($(this).hasClass('upvoted')) $(this).data('upvoted', true);

                        //also we have to update our internal counter of votes for the log to display it correctly on sorting

                        var log_index = false;
                        for (var i = 0; i < all_logs.length; i++) {
                            if(all_logs[i].LogID == $(this).data('log-id')){
                                log_index = i;
                            }
                        }

                        if(log_index === false){
                            return upvoteLog($(this));
                            throw Error('Could not find Log coresponding to Upvote clicked.');
                        }

                        if($(this).hasClass('upvoted')){
                            all_logs[log_index].greatStory -= 1;
                            all_logs[log_index].greatStoryupvotedByUser = false;
                        }else{
                            all_logs[log_index].greatStory += 1;
                            all_logs[log_index].greatStoryupvotedByUser = true;
                        }

                        return upvoteLog($(this));
                    });
                });

                $('.helpful-btn').each(function(){
                    $(this).unbind('click');
                    $(this).click(function(){

                        // there is a bug (or a feature) in jQuery(?):
                        // if you have a data attribute (like data-upvoted="false") and you also have set objekt.data(upvoted,"true")
                        // JQuery will override your data value with the data value from the dom. So we check here, if the button has
                        // a class "upvoted", and if yes, we reset the object.data("upvoted") to true. Otherwise, when the button is
                        // upvoted, the first click would not result in "not upvoting" the log, but the secound.
                        if($(this).hasClass('upvoted')) $(this).data('upvoted', true);

                        //also we have to update our internal counter of votes for the log to display it correctly on sorting

                        var log_index = false;
                        for (var i = 0; i < all_logs.length; i++) {
                            if(all_logs[i].LogID == $(this).data('log-id')){
                                log_index = i;
                            }
                        }

                        if(log_index === false){
                            return upvoteLog($(this));
                            throw Error('Could not find Log coresponding to Upvote clicked.');
                        }

                        if($(this).hasClass('upvoted')){
                            all_logs[log_index].helpful -= 1;
                            all_logs[log_index].helpfulupvotedByUser = false;
                        }else{
                            all_logs[log_index].helpful += 1;
                            all_logs[log_index].helpfulupvotedByUser = true;
                        }

                        return upvoteLog($(this));
                    });
                });
            }

            if (settings_show_all_logs) {
                var logsCount = parseInt(settings_show_all_logs_count);
                if (logsCount == 0) logsCount = 5000;
                else if (logsCount < 26) logsCount = 26;
                else if (logsCount%2 != 0) logsCount += 1;
                gclh_load_logs(logsCount);
            } else gclh_load_logs(30);

        } catch(e) {gclh_error("Replace Log-Loading function",e);}

    }

    // Zeilen in Cache Listings in Zebra und für User, Owner, Reviewer und VIP einfärben.
    function setLinesColorInCacheListing() {
        if (is_page("cache_listing")) {
            // ('find("tr")' reicht hier nicht wegen der Bilder.)
            var lines = $(document.getElementById("cache_logs_table2") || document.getElementById("cache_logs_table")).find("tbody").find("tr.log-row:not(.gclh_colored,.display_none)");
            lines.addClass("gclh_colored");
            var owner = get_real_owner();
            setLinesColorInZebra(settings_show_cache_listings_in_zebra, lines, 1);
            setLinesColorUser("settings_show_cache_listings_color", "user,owner,reviewer,vips", lines, 1, owner);
        }
    }
    // Bei Click auf VIP Icon, Einfärbung für VIP neu machen.
    function setLinesColorVip(user) {
        if (is_page("cache_listing")) {
            var lines = $(document.getElementById("cache_logs_table2") || document.getElementById("cache_logs_table")).find("tbody").find("tr.log-row");
            var count = 1;
            var owner = get_real_owner();
            var paraStamm = "settings_show_cache_listings_color";
        } else if (document.location.href.match(/\.com\/track\/details\.aspx/)) {
            var lines = $("table.Table").find("tbody").find("tr");
            var count = 2;
            var owner = document.getElementById("ctl00_ContentBody_BugDetails_BugOwner").innerHTML;
            var paraStamm = "settings_show_tb_listings_color";
        }
        if (!lines) return;
        var linesNew = new Array();
        for (var i = 0; i < lines.length; i++) {
            var aTags = lines[i].getElementsByTagName("a");
            for (var j = 0; j < aTags.length; j++) {
                if (aTags[j].getAttribute("name") == user) {
                    for (var k = 0; k < count; k++) {linesNew.push(lines[i+k]);}
                }
            }
        }
        if (linesNew.length > 0) setLinesColorUser(paraStamm, "user,owner,reviewer,vips", linesNew, count, owner);
    }

// Farben für Zeilen in gewöhnlichen Listen und TB Listing setzen. Im Cache Listing wird nur css benötigt.
    try {
        var css = "table.Table tr.AlternatingRow td, .AlternatingRow, table.Table tr td.AlternatingRow {background-color: #" + getValue("settings_lines_color_zebra") + " !important;}"
                + "table.Table tr.TertiaryRow td, .TertiaryRow, table.Table tr td.TertiaryRow {background-color: #" + getValue("settings_lines_color_user") + " !important;}"
                + "table.Table tr.QuaternaryRow td, .QuaternaryRow, table.Table tr td.QuaternaryRow {background-color: #" + getValue("settings_lines_color_owner") + " !important;}"
                + "table.Table tr.QuinaryRow td, .QuinaryRow, table.Table tr td.QuinaryRow {background-color: #" + getValue("settings_lines_color_reviewer") + " !important;}"
                + "table.Table tr.SenaryRow td, .SenaryRow, table.Table tr td.SenaryRow {background-color: #" + getValue("settings_lines_color_vip") + " !important;}";
        appendCssStyle(css);
        // BMlisten ALT: Zeilen in Zebra und Funde User einfärben. BMlisten scheinen einzige Listen, bei denen das nicht vorgesehen ist.
        if (document.location.href.match(/\.com\/bookmarks\/(view\.aspx\?guid=|bulk\.aspx\?listid=|view\.aspx\?code=)/) && document.getElementById('ctl00_ContentBody_ListInfo_cboItemsPerPage')) {
            var lines = $("table.Table").find("tbody").find("tr");
            setLinesColorInZebra(settings_show_common_lists_in_zebra, lines, 2);
            setLinesColorUser("settings_show_common_lists_color", "user", lines, 2, "", true);
        // TB Listing: Zeilen in Zebra, für User, Owner, Reviewer und VIP einfärben.
        } else if (document.location.href.match(/\.com\/track\/details\.aspx\?/)) {
            var lines = $("table.Table").find("tbody").find("tr");
            if (lines.length > 1) {
                var linesNew = lines.slice(0, -1);
                var owner = document.getElementById("ctl00_ContentBody_BugDetails_BugOwner").innerHTML;
                setLinesColorInZebra(settings_show_tb_listings_in_zebra, linesNew, 2);
                setLinesColorUser("settings_show_tb_listings_color", "user,owner,reviewer,vips", linesNew, 2, owner);
            }
        // Andere Listen: In Zeilen gegebenenfalls Einfärbung für Zebra oder User entfernen.
        } else if (!is_page("cache_listing")) {
            if (document.location.href.match(/\.com\/my\/recentlyviewedcaches\.aspx/)) {
                var lines = $("table").find("tbody").find("tr");
                var replaceSpec = /(AlternatingRow)(\s*)/g;
                setLinesColorNone(lines, replaceSpec);
                var replaceSpec = /(TertiaryRow)(\s*)/g;
                setLinesColorNone(lines, replaceSpec);
                if (settings_show_common_lists_in_zebra == true){
                    var lines = $("table.Table").find("tbody").find("tr").slice(1);
                    setLinesColorInZebra(settings_show_common_lists_in_zebra, lines, 1);
                }
                if (settings_show_common_lists_color_user == true){
                    setLinesColorUser("settings_show_common_lists_color", "user", lines, 1, "", true);
                }
            } else {
                if (settings_show_common_lists_in_zebra == false){
                    var lines = $("table").find("tbody").find("tr");
                    var replaceSpec = /(AlternatingRow)(\s*)/g;
                    setLinesColorNone(lines, replaceSpec);
                }
                if (settings_show_common_lists_color_user == false){
                    var lines = $("table").find("tbody").find("tr");
                    var replaceSpec = /(TertiaryRow)(\s*)/g;
                    setLinesColorNone(lines, replaceSpec);
                    // Wenn User nicht eingefärbt werden soll, Zebra aber ausgewählt ist, dann muss Zebra explizit gesetzt werden, weil nur ein Wert im Standard
                    // gesetzt wurde, hier eben Wert für User.
                    if (settings_show_common_lists_in_zebra) {
                        if (document.location.href.match(/\.com\/seek\/nearest\.aspx\?/)) {
                            // Überschrift weglassen, einzeilig.
                            var lines = $("table.Table").find("tbody").find("tr").slice(1);
                            setLinesColorInZebra(settings_show_common_lists_in_zebra, lines, 1);
                        }
                    }
                }
            }
        }
    } catch(e) {gclh_error("Color lines in lists",e);}

// Improve old dashboard. (Muß nach VIP laufen.)
    if (is_page("profile")) {
        try {
            var css = ".YourProfileWidget h3 {padding-left: 0.5em;} .YourProfileWidget h3 img {padding-right: 0.2em;}";
            // Show/Hide einbauen in rechter Spalte.
            var code = "function hide_box(i){";
            code += "  if(document.getElementById('box_'+i).style.display == 'none'){";
            code += "    document.getElementById('box_'+i).style.display = 'block';";
            code += "    document.getElementById('lnk_'+i).src = '/images/minus.gif';";
            code += "    document.getElementById('lnk_'+i).title = 'hide';";
            code += "  }else{";
            code += "    document.getElementById('box_'+i).style.display = 'none';";
            code += "    document.getElementById('lnk_'+i).src = '/images/plus.gif';";
            code += "    document.getElementById('lnk_'+i).title = 'show';";
            code += "  }";
            code += "}";
            injectPageScript(code, "body");
            var boxes = $('.WidgetHeader');
            function saveStates() {
                // Wenn Linklist angezeigt wird, dann mit Speicherindex "i" von Linklist beginnen, er ist 0. Ansonsten mit 1 beginnen.
                if (settings_bookmarks_show) var i = 0;
                else var i = 1;
                // Alle gefundenen WidgetBody "wb" verarbeiten und ihnen den zugehörigen Speicherindex "i" zuordnen.
                for (var wb = 0; wb < boxes.length; wb++) {
                    var box = boxes[wb].parentNode.getElementsByClassName('WidgetBody')[0];
                    if (typeof(box) == "undefined") continue;
                    var show = box.style.display;
                    if (typeof(show) == "undefined" || show != "none") show = "block";
                    setValue("show_box[" + i + "]", show);
                    i++;
                }
            }
            // Wenn Linklist angezeigt wird, dann mit Speicherindex "i" von Linklist beginnen, er ist 0. Ansonsten mit 1 beginnen.
            if (settings_bookmarks_show) var i = 0;
            else var i = 1;
            // Alle gefundenen WidgetBody "wb" verarbeiten und ihnen den zugehörigen Speicherindex "i" zuordnen.
            for (var wb = 0; wb < boxes.length; wb++) {
                var box = boxes[wb].parentNode.getElementsByClassName('WidgetBody')[0];
                if (typeof(box) != "undefined") {
                    box.setAttribute("id", "box_" + i);
                    if (typeof(getValue("show_box[" + i + "]")) != "undefined") box.style.display = getValue("show_box[" + i + "]");
                    if (box.style.display == "none") {
                        boxes[wb].innerHTML = "<img id='lnk_" + i + "' src='/images/plus.gif' onClick='hide_box(\"" + i + "\");' title='show' style='cursor: pointer'> " + boxes[wb].innerHTML;
                    } else {
                        boxes[wb].innerHTML = "<img id='lnk_" + i + "' src='/images/minus.gif' onClick='hide_box(\"" + i + "\");' title='hide' style='cursor: pointer'> " + boxes[wb].innerHTML;
                    }
                    $('#lnk_' + i)[0].addEventListener("click", saveStates, false);
                }
                i++;
            }
            if ($('#ctl00_ContentBody_WidgetMiniProfile1_LoggedInPanel').length > 0) {
                // Hide TBs/Coins.
                if (settings_hide_visits_in_profile) {
                    $(".Table.WordWrap tr").filter(function(index) {
                        return $(this).find("img[src$='logtypes/75.png']").length !== 0;
                    }).remove();
                }
                // Remove fixed column width in last 30 days logs for fewer linebreaks.
                if ($('.Table.WordWrap tr').length > 0) {
                    $('.Table.WordWrap')[0].setAttribute("style", "table-layout: unset;");
                    $('.Table.WordWrap tr td').each(function() {
                        this.setAttribute("style", "width: unset;" + (in_array(this.cellIndex, [0,1,4]) ? " white-space: nowrap;" : ""));
                    });
                }
            }
            appendCssStyle(css);
        } catch(e) {gclh_error("Improve old dashboard",e);}
    }

// Improve new dashboard.
    if (is_page("dashboard")) {
        try {
            var css = '';
            // Compact layout (little bit narrower elements).
            if (settings_compact_layout_new_dashboard) {
                css += ".action-link a {padding: 5px 20px; height: 29.2px !important;}";
                css += ".bio-username {color: #02874D; font-size: 1.3em !important; word-break: break-all;}";
                css += ".bio-background {height: 90px !important; background-size: 100% 140% !important;}";
                css += ".bio-meta {padding: 16px 0px !important;}";
                css += ".activity-item, .panel-header {padding: 5px 15px;}";
                css += ".activity-tray {padding: 5px 40px;}";
                css += ".sidebar-links .link-header {padding: 6px 5px 6px 20px !important;}";
                css += ".alert {padding: 6px 16px !important; color: blue;}";
            }
            // Map and Search button in left sidebar.
            if (settings_but_search_map) {
                var target = (settings_but_search_map_new_tab ? "_blank" : "");
                var nav = document.querySelector('.sidebar-links');
                var ul = nav.querySelector('ul');
                var newmapbtn = document.createElement('li');
                newmapbtn.classList.add("action-link");
                newmapbtn.innerHTML = '<a class="gclh_svg_fill" href="/map/" target="'+target+'"><svg class="icon"><use xlink:href="/account/app/ui-icons/sprites/global.svg#icon-map-no-border"></use></svg>Map</a>';
                ul.insertBefore(newmapbtn, ul.childNodes[0]);
                var newsearchbtn = document.createElement('li');
                newsearchbtn.classList.add ("action-link");
                newsearchbtn.innerHTML = '<a class="gclh_svg_fill" href="/play/search" target="'+target+'"><svg class="icon"><use xlink:href="/account/app/ui-icons/sprites/global.svg#icon-spyglass-svg-fill"></use></svg>Search</a>';
                ul.insertBefore(newsearchbtn, ul.childNodes[0]);
                css += ".action-link a {height: 43.6px;} a.gclh_svg_fill {fill: #4a4a4a;} a.gclh_svg_fill:hover {fill: #02874d;}";
            }
            // Show/Hide einbauen in linker Spalte.
            var list = $('.sidebar-links .link-header:not(.gclh), .sidebar-links .link-block:not(.gclh)');
            var ident = 0;
            for (var i = 0; i < list.length; i=i+2) {
                ident++;
                $(list[i]).addClass(getValue("show_box_dashboard_" + ident, true) == true ? "gclh" : "gclh isHide");
                $(list[i+1]).addClass(getValue("show_box_dashboard_" + ident, true) == true ? "" : "isHide");
                list[i].setAttribute("name", "head_" + ident);
                list[i].innerHTML += "<svg><use xlink:href='/account/app/ui-icons/sprites/global.svg#icon-expand-svg-fill' title=''></use></svg>";
                list[i].addEventListener("click", showHideBoxDashboard, false);
            }
            // Show trackables inventory.
            if (settings_show_tb_inv) {
                var side = $('.sidebar-links').last().find('ul.link-block li a[href*="/my/inventory.aspx"]').closest('li');
                GM_xmlhttpRequest({
                    method: "GET",
                    url: "/my/inventory.aspx",
                    onload: function(response) {
                        if (response.responseText) {
                            var anzTbs = 0;
                            var li = document.createElement('li');
                            var ul = document.createElement('ul');
                            ul.setAttribute('class', 'gclh');
                            $(response.responseText).find('table.Table tbody tr').each(function() {
                                anzTbs++;
                                if (anzTbs <= 10) {
                                    var link = $(this).find('a.lnk')[0].href;
                                    var src = $(this).find('.lnk img')[0].src;
                                    var name = $(this).find('.lnk span')[0].innerHTML;
                                    var html = '<li><a href="'+link+'" title="'+name+'" target="_blank" rel="noopener noreferrer"><img src="'+src+'" width="16" height="16"><span>'+name+'</span></a></li>';
                                    ul.innerHTML += html;
                                } else {
                                    var html = '<li><a href="/my/inventory.aspx" style="margin-left: 34px;" target="_blank" rel="noopener noreferrer"><span>... more</span></a></li>';
                                    ul.innerHTML += html;
                                    return;
                                }
                            });
                            if (anzTbs != 0) {
                                li.append(ul);
                                side[0].parentNode.insertBefore(li, side[0].nextSibling);
                            }
                        }
                     }
                 });
                 css += ".link-block .gclh a {font-size: 14px; margin-left: 16px;} .link-block .gclh span:hover {text-decoration: underline; color: #02874d;}";
                 css += ".link-block .gclh span {overflow: hidden; vertical-align: top; white-space: nowrap; text-overflow: ellipsis; display: inline-block; margin-left: 2px; max-width: 220px;}";
            }
            // Add link to Ignore List into dashboard sidebar.
            if (settings_embedded_smartlink_ignorelist && $(".bio-userrole").text() == "Premium" ) {
                var sidebarLists = $($('ul.link-block:not(".gclh") a[href*="/my/watchlist.aspx"]'));
                var html = '<li><a id="gclh_goto_ignorelist" href="/plan/lists/ignored">Ignore List</a></li>';
                sidebarLists.parent().after(html);
            }
            appendCssStyle(css);
        } catch(e) {gclh_error("Improve new dashboard",e);}
    }

// Funktionen zum sortieren, in der unpublished Übersicht und in der Erweiterung im Dashboard.
    function abc(a, b) {
        var sort = (a.getElementsByTagName('strong')[0].innerHTML < b.getElementsByTagName('strong')[0].innerHTML) ? -1 : (b.getElementsByTagName('strong')[0].innerHTML < a.getElementsByTagName('strong')[0].innerHTML) ? 1 : 0;
        return sort;
    }
    function gcOld(a, b) {
        var sort = (a.getElementsByTagName('a')[0].href.substring(19, 26) < b.getElementsByTagName('a')[0].href.substring(19, 26)) ? -1 : (b.getElementsByTagName('a')[0].href.substring(19, 26) < a.getElementsByTagName('a')[0].href.substring(19, 26)) ? 1 : 0;
        return sort;
    }
    function gcNew(a, b) {
        var sort = (a.getElementsByTagName('a')[0].href.substring(19, 26) > b.getElementsByTagName('a')[0].href.substring(19, 26)) ? -1 : (b.getElementsByTagName('a')[0].href.substring(19, 26) > a.getElementsByTagName('a')[0].href.substring(19, 26)) ? 1 : 0;
        return sort;
    }

// Füge Unpublished Caches zum Dashboard.
    if (is_page('dashboard') && settings_showUnpublishedHides) {
        try {
            $.get('https://www.geocaching.com/account/dashboard/unpublishedcaches', null, function(text) {
                // Look for unpublished Caches.
                var unpublished_list = $(text).find('#UnpublishedCaches li');
                if (unpublished_list != null) {
                    if(unpublished_list.length > 0){
                        // We found unpublished.
                        if (settings_set_showUnpublishedHides_sort) {
                            switch (settings_showUnpublishedHides_sort) {
                                case 'abc':
                                    unpublished_list.sort(abc);
                                    break;
                                case 'gcNew':
                                    unpublished_list.sort(gcNew);
                                    break;
                                case 'gcOld':
                                    unpublished_list.sort(gcOld);
                                    break;
                                default:
                                    gclh_error("Sort unpublished caches on dashboard", e);
                            }
                        }
                        var unpublished_caches = document.createElement('div');
                        unpublished_caches.setAttribute('id', 'GClh_unpublishedCaches');
                        unpublished_caches.setAttribute('class', 'panel collapsible');
                        var head = document.createElement('div');
                        head.setAttribute('class', 'panel-header isActive');
                        head.innerHTML = '    <h1 class="h5 no-margin">Unpublished Hides</h1>'
                                       + '    <svg height="22" width="22" class="opener">'
                                       + '        <use xlink:href="/account/app/ui-icons/sprites/global.svg#icon-expand-svg-fill"></use>'
                                       + '    </svg>';
                        head.addEventListener('click', function() {
                            if (getValue('unpublishedCaches_visible', true)) {
                                head.setAttribute('class', 'panel-header');
                                html.setAttribute('style', 'display:none;padding-left:unset;');
                                setValue('unpublishedCaches_visible', false);
                            }else {
                                head.setAttribute('class', 'panel-header isActive');
                                html.setAttribute('style', 'padding-left:unset;');
                                setValue('unpublishedCaches_visible', true);
                            }
                        });
                        unpublished_caches.appendChild(head);
                        var html = document.createElement('ul');
                        if (!getValue('unpublishedCaches_visible', false)) {
                            head.setAttribute('class', 'panel-header');
                            html.setAttribute('style', 'display:none;padding-left:unset;');
                        }else {
                            html.setAttribute('style', 'padding-left: unset');
                        }
                        for (let i=0; i<unpublished_list.length; i++) {
                            let icon = unpublished_list[i].getElementsByTagName('div')[0];
                            let name = unpublished_list[i].getElementsByTagName('div')[1];
                            name.getElementsByTagName('p')[0].setAttribute('style', 'margin:unset;');
                            let cacheUrl = 'https://www.geocaching.com/geocache/' + name.getElementsByTagName('a')[0].href.substring(19, 26);
                            $.get(cacheUrl, null, function(text2){
                                let span = document.createElement('span');
                                span.setAttribute('style', 'font-size: .875rem;');
                                let divs = $(text2).find('#divContentMain div');
                                if (divs[0].id == 'unpublishedMessage') { //Der Cache ist noch nicht eingereicht, du hast ihn disabled oder dem Reviewer geantwortet.
                                    span.innerHTML = '<b>Status:</b> <em>Disabled</em>';
                                }else if (divs[0].id == 'unpublishedReviewerNoteMessage') { //Der Reviewer hat geantwortet
                                    span.innerHTML = '<b>Status:</b> <em>Your reviewer has responded</em>';
                                }else if (divs[0].id == 'unpublishedEnabledMessage') { //Der Cache wurde submited, aber noch nicht von einem Reviewer bearbeitet
                                    span.innerHTML = '<b>Status:</b> <em>Waiting for review</em>';
                                }else if (divs[0].id == 'ctl00_ContentBody_lockedMessage') { //Der Cache wurde überprüft und wartet auf den publish
                                    span.innerHTML = '<b>Status:</b> <em>Ready to publish</em>';
                                }else {
                                    let errorMsg = 'GS change something. Error: Show status for' + name.getElementsByTagName('a')[0].href.substring(19, 26);
                                    gclh_error(errorMsg, e);
                                }
                                icon.appendChild(span);
                            });
                            icon.setAttribute('style', 'display:flex; align-items:center; justify-content:flex-start;');
                            icon.getElementsByTagName('svg')[0].setAttribute('style', 'margin-top: unset;');
                            let li = document.createElement('li');
                            li.setAttribute('class', 'activity-item');
                            li.appendChild(icon);
                            li.appendChild(name);
                            html.appendChild(li);
                        }
                        unpublished_caches.appendChild(html);
                        document.getElementsByClassName('sidebar-right')[0].appendChild(unpublished_caches);
                    }
                }
            });
        } catch(e) {gclh_error("Show unpublished hides in dashboard", e);}
    }

// Liste mit unveröffentlichten Caches sortieren.
    if (settings_set_compactLayoutUnpublishedHides_sort && document.location.pathname.match(/^\/account\/dashboard\/unpublishedcaches/)) {
        try {
            var unpublishedCaches_ol = document.querySelectorAll('#LayoutFeed ol');
            // Damit nicht mehrere Listen (deaktiviert / eingereicht) durcheinander gewürfelt werden.
            for (let index=0; index<unpublishedCaches_ol.length; index++) {
                var unpublishedCaches_original = unpublishedCaches_ol[index].querySelectorAll('li');
                var unpublishedCaches_list = new Array();
                for (let i=0; i<unpublishedCaches_original.length; i++) { //in ein eigenes Array einfügen, damit .sort() funktioniert
                    unpublishedCaches_list.push(unpublishedCaches_original[i]);
                }
                switch (settings_compactLayoutUnpublishedHides_sort) {
                    case 'abc':
                        unpublishedCaches_list.sort(abc);
                        break;
                    case 'gcNew':
                        unpublishedCaches_list.sort(gcNew);
                        break;
                    case 'gcOld':
                        unpublishedCaches_list.sort(gcOld);
                        break;
                    default:
                        gclh_error("Sort unpublished caches",e);
                        break;
                }
                // Erst alle Listen Elemente entfernen, da .replace() nicht funtioniert.
                for (let i=0; i<unpublishedCaches_original.length; i++) {
                    unpublishedCaches_original[i].remove();
                }
                for (let i=0; i<unpublishedCaches_original.length; i++) {
                    document.getElementById('LayoutFeed').getElementsByTagName('ol')[index].appendChild(unpublishedCaches_list[i]);
                }
            }
        } catch(e) {gclh_error("Sort unpublished caches",e);}
    }

// Compact Layout für unveröffentlichten Caches.
    if (settings_compactLayout_unpublishedList && document.location.pathname.match(/^\/account\/dashboard\/unpublishedcaches/)) {
        try {
            document.getElementById('LayoutFeed').setAttribute('style', 'max-width:max-content; min-width:600px; width:unset;');
            if (document.getElementById('UnpublishedCaches')) {
                var unpublished_caches_list = document.querySelectorAll('#UnpublishedCaches li');
                for (let i=0; i<unpublished_caches_list.length; i++) {
                    let li = document.createElement('li');
                    li.setAttribute('class', 'activity-item');
                    let icon = unpublished_caches_list[i].getElementsByTagName('div')[0];
                    let name = unpublished_caches_list[i].getElementsByTagName('a')[0];
                    name.setAttribute('style', 'font-size: .875rem;');
                    icon.appendChild(name);
                    icon.setAttribute('style', 'display:flex; align-items:center; justify-content:flex-start;');
                    icon.getElementsByTagName('svg')[0].setAttribute('style', 'margin-top:unset;');
                    li.appendChild(icon);
                    unpublished_caches_list[i].parentNode.replaceChild(li, unpublished_caches_list[i]);
                }
            }else {
                var h6 = document.createElement('h6');
                h6.setAttribute('class', 'h6');
                h6.innerHTML = 'You Have No Unpublished Caches';
                document.getElementById('LayoutFeed').appendChild(h6);
            }
        } catch(e) {gclh_error("Compact layout for unpublished caches",e);}
    }

// Show thumbnails.
    if (settings_show_thumbnails) {
        try {
            // my: Großes Bild; at: Kleines Bild; Man gibt an, wo sich beide berühren. Es scheint so, dass zuerst horizontal und dann vertikal benannt werden muss.
            function placeToolTip(element, stop) {
                $('a.gclh_thumb:hover span').position({
                    my: "center bottom",
                    at: "center top",
                    of: "a.gclh_thumb:hover",
                    collision: "flipfit flipfit"
                });
                if (!stop) {
                    $('a.gclh_thumb:hover span img').load(function() {
                        placeToolTip(element, true);
                    });
                }
            }
            function buildThumb(href, title, showName, topSp) {
                var hrefLarge = (href.match(/\/large\//) ? href : href.replace(/\/cache\//,"/cache/large/"));
                links[i].classList.add("gclh_thumb");
                links[i].href = hrefLarge.replace(/\/large\//,"/");
                links[i].onmouseover = placeToolTip;
                var html = '<img src="'+hrefLarge.replace(/\/large\//,"/thumb/")+'" title="'+title+'">';
                if (showName) html += '<br>'+title;
                html += '<span>#top#<img class="gclh_max" src="'+hrefLarge.replace(/\/large\//,"/thumb/large/")+'">#bot#</span>';
                if (settings_imgcaption_on_top) html = html.replace("#top#",title).replace("#bot#","");
                else html = html.replace("#top#","").replace("#bot#",title);
                links[i].innerHTML = html;
                if (topSp && settings_spoiler_strings != "" && title.match(regexp)) {
                    var div = document.createElement("div");
                    div.innerHTML = "Spoiler warning";
                    div.setAttribute("style", "transform: rotate(-30grad); width: 130px; position: relative; top: "+topSp+"; left: -5px; font-size: 11px; line-height: 0;");
                    links[i].childNodes[0].src = urlImages+"gclh_logo.png";
                    links[i].childNodes[0].style.opacity = "0.05";
                    if (showName) links[i].childNodes[3].remove();
                    else links[i].childNodes[1].remove();
                    links[i].parentNode.appendChild(div);
                }
            }
            var regexp = new RegExp(settings_spoiler_strings, "i");
            var css = "";

            // Cache Listing.
            if (is_page("cache_listing") && !isMemberInPmoCache()) {
                // Logs.
                if (settings_load_logs_with_gclh) {
                    var newImTpl = "<a class='tb_images lnk gclh_thumb' onmouseover='placeToolTip;' rel='fb_images_${LogID}' href='"+http+"://img.geocaching.com/cache/log/${FileName}' title='<span class=&quot;LogImgTitle&quot;>${Name} &nbsp;</span><span class=&quot;LogImgLink&quot;> <a target=&quot;_blank&quot; href=&quot;/seek/log.aspx?LID=${LogID}&amp;IID=${ImageGuid}&quot;>View Log</a></span><br><span class=&quot;LogImgDescription&quot;>${Descr}</span>'>"
                                 + "<img title='${Name}' alt='${Name}' src='"+http+"://img.geocaching.com/cache/log/thumb/${FileName}'/> "
                                 + "<span title=''>#top#<img title='${Descr}' class='gclh_max' src='"+http+"://img.geocaching.com/cache/log/thumb/large/${FileName}'>#bot#</span></a>";
                    if (settings_imgcaption_on_top) newImTpl = newImTpl.replace('#top#', '${Name}').replace('#bot#', '');
                    else  newImTpl = newImTpl.replace('#top#', '').replace('#bot#', '${Name}');
                    var code = "function gclh_updateTmpl() {"
                             + " if ($.template != undefined) {"
                             + "  delete $.template['tmplCacheLogImages'];"
                             + "  $.template(\"tmplCacheLogImages\",\""+newImTpl+"\");"
                             + "} }"
                             + "gclh_updateTmpl();"
                             + placeToolTip.toString();
                    injectPageScript(code, "body");
                    css += ".TableLogContent {padding-left: 0; border-left: none;}";
                    css += ".LogImagesTable {margin-left: 0;} .LogImagesTable a.lnk {white-space: initial;}";
                    css += ".LogImagesTable a.gclh_thumb img {margin-bottom: 1px !important; margin-top: 1px; vertical-align: sub;}";
                }
                // Listing.
                css += ".CachePageImages li {margin-bottom: 12px; background: unset; padding-left: 0px;}";
                var links = $('.CachePageImages').find('a[href*="img.geocaching.com/cache/"]');
                for (var i = 0; i < links.length; i++) {
                    buildThumb(links[i].href, links[i].innerHTML, true, "-70px");
                }

            // Public Profile Avatar.
            } else if (is_page("publicProfile") && $('#ctl00_ContentBody_ProfilePanel1_uxProfilePhoto')[0]) {
                var image = $('#ctl00_ContentBody_ProfilePanel1_uxProfilePhoto')[0];
                var aPseudo = document.createElement("a");
                aPseudo.appendChild(image.cloneNode(true));
                image.parentNode.replaceChild(aPseudo, image);
                var link = $('#ctl00_ContentBody_ProfilePanel1_uxProfilePhoto').closest('a')[0];
                avatarThumbnail(link);

            // Galerien Public Profile, Cache, TB.
            } else if ((is_page("publicProfile") && $('#ctl00_ContentBody_ProfilePanel1_lnkGallery.Active')[0]) ||
                       document.location.href.match(/\.com\/(seek\/gallery\.aspx?|track\/gallery\.aspx?)/)) {
                var links = $('.Table.GalleryTable').find('a[href*="img.geocaching.com/track/"], a[href*="img.geocaching.com/cache/"]');
                for (var i = 0; i < links.length; i++) {
                    buildThumb(links[i].href, links[i].nextElementSibling.innerHTML, false, (document.location.href.match(/\.com\/seek\/gallery\.aspx?/) ? "-90px" : false));
                }

            // TB Listing.
            } else if (document.location.href.match(/\.com\/track\/details\.aspx?/)) {
                css += "a.gclh_thumb img {margin-bottom: unset !important; margin-right: unset;}";
                var links = $('.imagelist, table.Table .log_images').find('a[href*="img.geocaching.com/track/"]');
                for (var i = 0; i < links.length; i++) {
                    buildThumb(links[i].href, links[i].children[0].alt, (links[i].href.match(/log/) ? false : true), false);
                }
            }

            css +=
                "a.gclh_thumb:hover {" +
                "  white-space: unset;" +
                "  position: relative;}" +
                "a.gclh_thumb {" +
                "  overflow: visible !important;" +
                "  display: unset !important;" +
                "  max-width: none !important;}" +
                "a.gclh_thumb span {" +
                "  white-space: unset !important;" +
                "  visibility: hidden;" +
                "  position: absolute;" +
                "  top: -310px;" +
                "  left: 0px;" +
                "  padding: 2px;" +
                "  text-decoration: none;" +
                "  text-align: left;" +
                "  vertical-align: top;}" +
                "a.gclh_thumb:hover span {" +
                "  visibility: visible;" +
                "  z-index: 100;" +
                "  border: 1px solid #8c9e65;" +
                "  background-color: #dfe1d2;" +
                "  text-decoration: none !important;}" +
                "a.gclh_thumb:hover img {margin-bottom: -4px;}" +
                "a.gclh_thumb img {" +
                "  margin-bottom: -4px;" +
                "  height: 75px;}" +
                ".gclh_max {" +
                "  height: unset !important;" +
                "  vertical-align: unset !important;" +
                "  margin-right: 0 !important;" +
                "  max-height: " + settings_hover_image_max_size + "px;" +
                "  max-width:  " + settings_hover_image_max_size + "px;}";
            appendCssStyle(css);
        } catch(e) {gclh_error("Show Thumbnails",e);}
    }
    function avatarThumbnail(link) {
        var thumb = link.children[0];
        thumb.setAttribute("style", "margin-bottom: 0px; height: 48px;");
        var img = document.createElement('img');
        img.src = thumb.src.replace(/img\.geocaching\.com\/user\/avatar/, "s3.amazonaws.com/gs-geo-images").replace(/img\.geocaching\.com\/user\/display/, "s3.amazonaws.com/gs-geo-images");;
        img.className = "gclh_max";
        img.setAttribute("style", "display: unset;");
        var span = document.createElement('span');
        span.appendChild(img);
        link.className += " gclh_thumb";
        link.onmouseover = placeToolTip;
        link.appendChild(span);
    }
    function showBiggerAvatarsLink() {
        addButtonOverLogs(showBiggerAvatars, "gclh_show_bigger_avatars", true, "Show bigger avatars", "Show bigger avatar images while hovering with the mouse");
    }
    function showBiggerAvatars() {
        try {
            $('#gclh_show_bigger_avatars').addClass("working");
            setTimeout(function() {
                var links = document.getElementsByClassName("logOwnerAvatar");
                for (var i = 0; i < links.length; i++) {
                    if (links[i].children[0] && links[i].children[0].children[0] && !links[i].children[0].children[1]) {
                        avatarThumbnail(links[i].children[0]);
                    }
                }
                $('#gclh_show_bigger_avatars').removeClass("working");
            }, 100);
        } catch(e) {gclh_error("showBiggerAvatars",e);}
    }

// Show gallery images in 2 instead of 4 cols.
    if (settings_show_big_gallery && (is_page("publicProfile") || document.location.href.match(/\.com\/(seek\/gallery\.aspx?|track\/gallery\.aspx?)/))) {
        try {
            appendCssStyle("table.GalleryTable .imageLink {max-width: unset; max-height: unset;}");
            var links = document.getElementsByTagName("a");
            var tds = new Array();
            // Make images bigger.
            for (var i = 0; i < links.length; i++) {
                if (links[i].href.match(/^https?:\/\/img\.geocaching\.com\/(cache|track)\//) && links[i].childNodes[1] && links[i].childNodes[1].tagName == 'IMG') {
                    var thumb = links[i].childNodes[1];
                    thumb.style.width = "300px";
                    thumb.style.height = "auto";
                    thumb.src = thumb.src.replace(/thumb\//, "");
                    tds.push(thumb.parentNode.parentNode);
                }
            }
            // Change from 4 Cols to 2.
            if ((document.location.href.match(/\.com\/(seek\/gallery\.aspx?|track\/gallery\.aspx?)/) && tds.length > 1 && $('#ctl00_ContentBody_GalleryItems_DataListGallery')[0]) ||
                 (is_page("publicProfile") && tds.length > 1 && $('#ctl00_ContentBody_ProfilePanel1_UserGallery_DataListGallery')[0])) {
                var tbody = document.createElement("tbody");
                var tr = document.createElement("tr");
                var x = 0;
                for (var i = 0; i < tds.length; i++) {
                    if (x == 0) {
                        tr.appendChild(tds[i]);
                        x++;
                    } else {
                        tr.appendChild(tds[i]);
                        tbody.appendChild(tr);
                        tr = document.createElement("tr");
                        x = 0;
                    }
                }
                if (x != 0) {  // Einzelnes Bild übrig.
                    tr.appendChild(document.createElement("td"));
                    tbody.appendChild(tr);
                }
                if (is_page("publicProfile")) var dataListId = "ctl00_ContentBody_ProfilePanel1_UserGallery_DataListGallery";
                else var dataListId = "ctl00_ContentBody_GalleryItems_DataListGallery";
                document.getElementById(dataListId).removeChild(document.getElementById(dataListId).firstChild);
                document.getElementById(dataListId).appendChild(tbody);
            }
        } catch(e) {gclh_error("Show gallery images in 2 instead of 4 cols",e);}
    }

// Improve search map.
    if (is_page('searchmap')) {
        try {
            // Virtually hit "Search this area" after dragging the map.
            function searchThisArea() {
                if (!document.location.href.match(/\.com\/play\/map\?bm=/) && settings_searchmap_autoupdate_after_dragging) {
                    if (document.getElementById('clear-map-control')) {
                        document.getElementById('clear-map-control').click();
                    }
                }
            }

            // Processing all steps.
            function processAllSearchMap() {
                searchThisArea();
            }

            // Build mutation observer for body.
            function buildObserverBodySearchMap() {
                var observerBodySearchMap = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        processAllSearchMap();
                    });
                });
                var target = document.querySelector('body');
                var config = { attributes: true, childList: true, characterData: true };
                observerBodySearchMap.observe(target, config);
            }
            // Check if mutation observer for body can be build.
            function checkForBuildObserverBodySearchMap(waitCount) {
                if ($('body')[0]) {
                    if ($('.gclh_buildObserverBodySearchMap')[0]) return;
                    $('body').addClass('gclh_buildObserverBodySearchMap');
                   buildObserverBodySearchMap();
                } else {waitCount++; if (waitCount <= 200) setTimeout(function(){checkForBuildObserverBodySearchMap(waitCount);}, 50);}
            }

            checkForBuildObserverBodySearchMap(0);
            processAllSearchMap();

            var css = '';
            // Hide button search this area and icon loading.
            if (!document.location.href.match(/\.com\/play\/map\?bm=/) && settings_searchmap_autoupdate_after_dragging) {
                css += '#clear-map-control, .loading-container {display: none;}';
            }
            if (css != "") appendCssStyle(css);
        } catch(e) {gclh_error("Improve search map",e);}
    }

// Display Google-Maps warning, wenn Leaflet-Map nicht aktiv ist.
    if (document.location.href.match(/\.com\/map\//)) {
        try {
            // Wenn Leaflet-Map aktiv, alles ok, Kz aktiv merken.
            if ($('.leaflet-container')[0]) setValue("gclhLeafletMapActive", true);
            // Wenn Screen "Set Map Preferences", Leaflet-Map wird nicht kommen, also nichts tun.
            else if ($('.container')[0]);
            // Wenn Leaflet-Map Kz aktiv und Screen "Set Map Preferences" nicht angezeigt wird, dann ist Google aktiv.
            else {
                // Prüfen, ob zuvor Leaflet-Map aktiv war, Status sich also geändert hat, dann Meldung ausgeben, neuen Status "nicht aktiv" merken.
                if (getValue("gclhLeafletMapActive", true)) {
                    setValue("gclhLeafletMapActive", false);
                    var mess = "Please note, that GC little helper only supports\n"
                             + "the Leaflet-Map. You are using the Google-Map.\n\n"
                             + "You can change the map in the left sidebar with \n"
                             + "the button \"Set Map Preferences\".";
                    alert(mess);
                }
            }
        } catch(e) {gclh_error("Display Google-Maps warning",e);}
    }

// Add layers, control to map and set default layers.
    if (settings_use_gclh_layercontrol && document.location.href.match(/\.com\/map\//) && getValue("gclhLeafletMapActive")) {
        try {
            // Auswahl nur bestimmter Layer.
            var map_layers = new Object();
            if (settings_map_layers == "" || settings_map_layers.length < 1) map_layers = all_map_layers;
            else {
                for (var i = 0; i < settings_map_layers.length; i++) map_layers[settings_map_layers[i]] = all_map_layers[settings_map_layers[i]];
            }
            // Layer Control aufbauen.
            function addLayerControl() {
                injectPageScriptFunction(function(map_layers, map_overlays, settings_map_default_layer, settings_show_hillshadow) {
                    window["GCLittleHelper_MapLayerHelper"] = function(map_layers, map_overlays, settings_map_default_layer, settings_show_hillshadow) {
                        if (!window.MapSettings.Map) {
                            setTimeout(function() {window["GCLittleHelper_MapLayerHelper"](map_layers, map_overlays, settings_map_default_layer, settings_show_hillshadow);}, 10);
                        } else {
                            var layerControl = new window.L.Control.Layers();
                            var layerToAdd = null;
                            var defaultLayer = null;
                            for (name in map_layers) {
                                layerToAdd = new L.tileLayer(map_layers[name].tileUrl, map_layers[name]);
                                layerControl.addBaseLayer(layerToAdd, name);
                                if (name == settings_map_default_layer) defaultLayer = layerToAdd;
                                else if (defaultLayer == null) defaultLayer = layerToAdd;
                            }
                            for (name in map_overlays) {
                                layerToAdd = new L.tileLayer(map_overlays[name].tileUrl, map_overlays[name]);
                                layerControl.addOverlay(layerToAdd, name);
                            }
                            window.MapSettings.Map.addControl(layerControl);
                            layerControl._container.className += " gclh_layers gclh_used";
                            window.MapSettings.Map.addLayer(defaultLayer);
                            if (settings_show_hillshadow) $('.leaflet-control-layers.gclh_layers .leaflet-control-layers-overlays').find('label input').first().click();
                            var side = $('.leaflet-control-layers')[0];
                            var div = document.createElement("div");
                            div.setAttribute("class", "gclh_dummy gclh_used");
                            var aTag = document.createElement("a");
                            aTag.setAttribute("class", "leaflet-control-layers dummy_for_gme gclh_dummy gclh_used");
                            div.appendChild(aTag);
                            side.parentNode.insertBefore(div, side);
                            // Defekte Layer entfernen. (GCVote verursacht hier gelegentlich einen Abbruch, weil der dort verwendete localStorageCache scheinbar unvollständige Layer belebt.)
                            try {
                                for (layerId in window.MapSettings.Map._layers) {
                                    if (window.MapSettings.Map._layers[layerId]._url !== -1) {
                                        window.MapSettings.Map.removeLayer(window.MapSettings.Map._layers[layerId]);
                                    }
                                }
                            } catch(e) {};
                        }
                    };
                    window["GCLittleHelper_MapLayerHelper"](map_layers, map_overlays, settings_map_default_layer, settings_show_hillshadow);
                }, "(" + JSON.stringify(map_layers) + "," + JSON.stringify(map_overlays) + ",'" + settings_map_default_layer + "'," + settings_show_hillshadow + ")");
            }
            // Layer Defaults setzen.
            function setDefaultsInLayer() {
                var defaultLayer = "";
                for (name in map_layers) {
                    if (name == settings_map_default_layer) defaultLayer = name;
                    else if (defaultLayer == "") defaultLayer = name;
                }
                var labels = $('.leaflet-control-layers.gclh_layers.gclh_used .leaflet-control-layers-base').find('label');
                if (labels) {
                    for (var i=0; i<labels.length; i++) {
                        if (labels[i].children[1].innerHTML.match(defaultLayer)) {
                            labels[i].children[0].click();
                            break;
                        }
                    }
                }
                var hs = ".gclh_layers.gclh_used .leaflet-control-layers-overlays";
                if ($(hs).find('label input')[0]) {
                    if ((settings_show_hillshadow == true && $(hs).find('label input')[0].checked != true) ||
                        (settings_show_hillshadow != true && $(hs).find('label input')[0].checked == true)) {
                        $(hs).find('label input').first().click();
                    }
                }
            }
            // Layer Controls überwachen.
            function loopAtLayerControls(waitCount) {
                if ($('.leaflet-control-layers').length != 0) {
                    var somethingDone = 0;
                    if ($('.leaflet-control-layers:not(".gclh_used")').find('img[title*="GCVote"]').length != 0) {
                        somethingDone++;
                        $('.leaflet-control-layers:not(".gclh_used")').find('img[title*="GCVote"]').closest('.leaflet-control-layers').addClass('gclh_used');
                    }
                    if ($('#gclh_geoservices_control.leaflet-control-layers:not(".gclh_used")').length != 0) {
                        somethingDone++;
                        $('#gclh_geoservices_control.leaflet-control-layers:not(".gclh_used")').addClass('gclh_used');
                    }
                    if (somethingDone == 0) {
                        if ($('.leaflet-control-layers:not(".gclh_used"):not(".gclh_layers")').length != 0) {
                            somethingDone++;
                            $('.leaflet-control-layers:not(".gclh_used"):not(".gclh_layers")').remove();
                        }
                    }
                    if (somethingDone != 0) setDefaultsInLayer();
                }
                waitCount++;
                if (waitCount <= 100) setTimeout(function(){loopAtLayerControls(waitCount);}, 50);
            }
            addLayerControl();
            loopAtLayerControls(0);
        } catch(e) {gclh_error("Add layers, control to map and set default layers",e);}
    }

// Hide Map Header.
    if (document.location.href.match(/\.com\/map\//)) {
        try {
            function checkMapLeaflet(waitCount) {
                if ($('.leaflet-container')[0]) {
                    if (settings_hide_map_header) hide_map_header();
                    var sidebar = $('#searchtabs')[0];
                    var link = document.createElement("a");
                    link.appendChild(document.createTextNode("Hide/Show Header"));
                    link.href = "#";
                    link.addEventListener("click", hide_map_header, false);
                    // Link in Sidebar rechts orientieren wegen möglichem GC Tour script.
                    link.setAttribute("style", "float: right; padding-right: 3px;");
                    sidebar.appendChild(link);
                    // Link in Sidebar komplett anzeigen und auch nicht mehr überblenden, auch nicht durch GME.
                    appendCssStyle("#searchtabs {height: 63px !important; margin-top: 6px !important;} #searchtabs li a {padding: 0.625em 0.5em !important;}");
                } else {waitCount++; if (waitCount <= 50) setTimeout(function(){checkMapLeaflet(waitCount);}, 100);}
            }
            checkMapLeaflet(0);
            gclh_GetGcAccessToken( function(r) {
                all_map_layers["Geocaching"].accessToken = r.access_token;
            });
        } catch(e) {gclh_error("Hide Map Header",e);}
    }

// Change map parameter and add Homezone to map.
    if (document.location.href.match(/\.com\/map\//)) {
        try {
            function changeMap() {
                if (settings_map_hide_sidebar) {
                    if (document.getElementById("searchtabs").parentNode.style.left != "-355px") {
                        var links = document.getElementsByTagName("a");
                        for (var i = 0; i < links.length; i++) {
                            if (links[i].className.match(/ToggleSidebar/)) {
                                links[i].click();
                                break;
                            }
                        }
                    }
                    function hideSidebarRest(waitCount) {
                        if ($('.groundspeak-control-findmylocation')[0] && $('.leaflet-control-scale')[0] && $('.leaflet-control-zoom')[0]) {
                            // Wenn externe Kartenfilter vorhanden, dann gibt es keinen Balken zur Sidebar.
                            if (document.location.href.match(/&asq=/)) var styleLeft = "15px";
                            else var styleLeft = "30px";
                            $('.groundspeak-control-findmylocation')[0].style.left = styleLeft;
                            $('.leaflet-control-scale')[0].style.left = styleLeft;
                            $('.leaflet-control-zoom')[0].style.left = styleLeft;
                        } else {waitCount++; if (waitCount <= 50) setTimeout(function(){hideSidebarRest(waitCount);}, 200);}
                    }
                    hideSidebarRest(0);
                }
                function addHomeZoneMap(unsafeWindow, home_lat, home_lng, settings_homezone_radius, settings_homezone_color, settings_homezone_opacity) {
                    settings_homezone_color = settings_homezone_color.replace("##", "#");
                    if (unsafeWindow == "none") unsafeWindow = window;
                    if (typeof home_lat == "undefined" || typeof home_lng == "undefined" || home_lat == null || home_lng == null) return;
                    var opacity = settings_homezone_opacity / 100;
                    var opacity2 = opacity + 0.1;
                    var latlng = new unsafeWindow.L.LatLng((home_lat / 10000000), (home_lng / 10000000));
                    var options = {
                        color: settings_homezone_color,
                        weight: 1,
                        opacity: opacity2,
                        fillOpacity: opacity,
                        clickable: false
                    };
                    var circle = new unsafeWindow.L.Circle(latlng, settings_homezone_radius * 1000, options);
                    unsafeWindow.MapSettings.Map.addLayer(circle);
                }
                // Die Circles erst aufbauen wenn Karte fertig ist.
                function checkForAddHomeZoneMap(waitCount) {
                    if ($('.groundspeak-control-findmylocation')[0] && $('.leaflet-control-scale')[0]) {
                        if (settings_show_homezone) {
                            if (browser === "chrome" || browser === "firefox") {
                                injectPageScriptFunction(addHomeZoneMap, "('" + "none" + "', " + getValue("home_lat") + ", " + getValue("home_lng") + ", " + settings_homezone_radius + ", '#" + settings_homezone_color + "', " + settings_homezone_opacity + ")");
                            } else addHomeZoneMap(unsafeWindow, getValue("home_lat"), getValue("home_lng"), settings_homezone_radius, "#" + settings_homezone_color, settings_homezone_opacity);
                            for (var i in settings_multi_homezone) {
                                var curHz = settings_multi_homezone[i];
                                if (browser === "chrome" || browser === "firefox") {
                                    injectPageScriptFunction(addHomeZoneMap, "('" + "none" + "', " + curHz.lat + ", " + curHz.lng + ", " + curHz.radius + ", '#" + curHz.color + "', " + curHz.opacity + ")");
                                } else addHomeZoneMap(unsafeWindow, curHz.lat, curHz.lng, curHz.radius, "#" + curHz.color, curHz.opacity);
                            }
                        }
                    } else {waitCount++; if (waitCount <= 25) setTimeout(function(){checkForAddHomeZoneMap(waitCount);}, 200);}
                }
                checkForAddHomeZoneMap(0);
            }
            isMapLoad(changeMap);
            appendCssStyle(".leaflet-control-layers-base {min-width: 200px;} .add-list li {padding: 2px 0} .add-list li button {font-size: 14px; margin-bottom: 0px;}");
        } catch(e) {gclh_error("Change map parameter and add Homezone to map",e);}
    }

// Add links to Google, OSM, Flopp's und GeoHack Map on GC Map.
    if (is_page("map") && (settings_add_link_google_maps_on_gc_map || settings_add_link_osm_on_gc_map || settings_add_link_flopps_on_gc_map || settings_add_link_geohack_on_gc_map)) {
        try {
            function getMapCooords() {
                // Mögliche url Zusammensetzungen, Beispiele: https://www.geocaching.com/map ...
                // 1. /default.aspx?lat=50.889233&lng=13.386967#?ll=50.89091,13.39551&z=14
                //    /default.aspx?lat=50.889233&lng=13.386967#clist?ll=50.89172,13.36779&z=14
                //    /default.aspx?lat=50.889233&lng=13.386967#pq?ll=50.89204,13.36667&z=14
                //    /default.aspx?lat=50.889233&lng=13.386967#search?ll=50.89426,13.35955&z=14
                // 2. /?ll=50.89093,13.38437#?ll=50.89524,13.35912&z=14
                // 3. /#?ll=50.95397,6.9713&z=15
                var matches = document.location.href.match(/\\?ll=(-?[0-9.]*),(-?[0-9.]*)&z=([0-9.]*)/); // Beispiel 1., 2. und 3. hinten
                var matchesMarker = document.location.href.match(/\\?lat=(-?[0-9.]*)&lng=(-?[0-9.]*)/);  // Beispiel 1. vorne
                if (matchesMarker == null) {
                    var matchesMarker = document.location.href.match(/\\?ll=(-?[0-9.]*),(-?[0-9.]*)#/);  // Beispiel 2. vorne
                    if (matchesMarker == null) {
                        var matchesMarker = matches;                                                     // Beispiel 3.
                    }
                }
                var coords = null;
                if (matches != null && matchesMarker != null) {
                    coords = new Object();
                    coords.zoom = matches[3];
                    coords.lat = matches[1];
                    coords.lon = matches[2];
                    coords.markerLat = matchesMarker[1];
                    coords.markerLon = matchesMarker[2];
                    var latd = coords.lat;
                    var lond = coords.lon;
                    sign = latd > 0 ? 1 : -1;
                    coords.latOrient = latd > 0 ? 'N' : 'S';
                    latd *= sign;
                    coords.latDeg = Math.floor(latd);
                    coords.latMin = Math.floor((latd - coords.latDeg) * 60);
                    coords.latSec = Math.floor((latd - coords.latDeg - coords.latMin / 60) * 3600);
                    sign = lond > 0 ? 1 : -1;
                    coords.lonOrient = lond > 0 ? 'E' : 'W';
                    lond *= sign;
                    coords.lonDeg = Math.floor(lond);
                    coords.lonMin = Math.floor((lond - coords.lonDeg) * 60);
                    coords.lonSec = Math.floor((lond - coords.lonDeg - coords.lonMin / 60) * 3600);
                }
                return coords;
            }
            var urlGoogleMaps = 'https://maps.google.de/maps?q={markerLat},{markerLon}&z={zoom}&ll={lat},{lon}';
            var urlOSM = 'https://www.openstreetmap.org/?#map={zoom}/{lat}/{lon}';
            var urlFlopps = 'http://flopp.net/?c={lat}:{lon}&z={zoom}&t=OSM&f=n&m=&d=';
            var urlGeoHack = "https://tools.wmflabs.org/geohack/geohack.php?pagename=Geocaching&params={latDeg}_{latMin}_{latSec}_{latOrient}_{lonDeg}_{lonMin}_{lonSec}_{lonOrient}";
            function replaceData(str, coords) {
                re = new RegExp("\{[a-zA-Z]+\}", "g");
                var replacements = str.match(re);
                if (replacements != null) {
                    for (var i=0; i<replacements.length; i++) {
                        var replacement = replacements[i];
                        var name = replacement.substring(1,replacement.length-1);
                        if (name in coords) str = str.replace(replacement, coords[name]);
                    }
                }
                return str;
            }
            function callGeoService(url, in_same_tab) {
                var coords = getMapCooords();
                if (coords != null) {
                    url = replaceData(url, coords);
                    if (in_same_tab) location = url;
                    else window.open(url);
                } else alert('This map has no geographical coordinates in its link. Just zoom or drag the map, afterwards this will work fine.');
            }
            function initGeoServiceControl() {
                var div = document.createElement("div");
                div.setAttribute("id", "gclh_geoservices_control");
                div.setAttribute("class", "leaflet-control-layers leaflet-control");
                var aTag = document.createElement("a");
                aTag.setAttribute("id", "gclh_google_button");
                aTag.setAttribute("class", "leaflet-control-layers-toggle");
                aTag.setAttribute("title", "Show area on Google Maps");
                aTag.setAttribute("style", "background-image: url('/images/silk/map_go.png');");
                var side = document.getElementsByClassName("leaflet-top leaflet-right")[0];
                div.appendChild(aTag);
                side.appendChild(div);
                $("#gclh_geoservices_control").append('<div id="gclh_geoservices_list" class="leaflet-control-layers-base" style="display: none;"></div>');
                $("#gclh_geoservices_list").append('<b style="padding:5px; font-size:120%; color: #000000;">Go to ...</b>');
                var style = 'style="padding: 5px; cursor: pointer; color: #000;"';
                if (settings_add_link_google_maps_on_gc_map) $("#gclh_geoservices_list").append('<a id="gclh_geoservice_googlemaps"'+style+'>Google Maps</a>');
                if (settings_add_link_osm_on_gc_map) $("#gclh_geoservices_list").append('<a id="gclh_geoservice_osm"'+style+'>Openstreepmap</a>');
                if (settings_add_link_flopps_on_gc_map) $("#gclh_geoservices_list").append('<a id="gclh_geoservice_flopps"'+style+'>Flopp\'s Map</a>');
                if (settings_add_link_geohack_on_gc_map) $("#gclh_geoservices_list").append('<a id="gclh_geoservice_geohack"'+style+'>GeoHack</a>');
                $("#gclh_geoservice_googlemaps").click(function() {callGeoService(urlGoogleMaps, settings_switch_to_google_maps_in_same_tab);});
                $("#gclh_geoservice_osm").click(function() {callGeoService(urlOSM, settings_switch_to_osm_in_same_tab);});
                $("#gclh_geoservice_flopps").click(function() {callGeoService(urlFlopps, settings_switch_to_flopps_in_same_tab);});
                $("#gclh_geoservice_geohack").click(function() {callGeoService(urlGeoHack, settings_switch_to_geohack_in_same_tab);});
                $("#gclh_geoservices_control").hover(
                    function() {
                        $("#gclh_geoservices_control").addClass("leaflet-control-layers-expanded");
                        $("#gclh_google_button").hide();
                        $("#gclh_geoservices_list").show();
                    },
                    function() {
                        $("#gclh_geoservices_control").removeClass("leaflet-control-layers-expanded");
                        $("#gclh_geoservices_list").hide();
                        $("#gclh_google_button").show();
                    }
                );
                // Damit auch mehr als 2 Buttons handlebar.
                appendCssStyle(".leaflet-control-layers + .leaflet-control {position: unset; right: unset;} .leaflet-control {clear: left}");
            }
            function attachGeoServiceControl(waitCount) {
                // Prüfen, ob Layers schon vorhanden sind, erst dann den Button hinzufügen.
                if ($('.leaflet-control-layers-base').find('input.leaflet-control-layers-selector')[0]) {
                    // Damit Button nicht ständig den Platz wechselt, um 1 Sekunden verzögern.
                    setTimeout(initGeoServiceControl, 1000);
                } else {waitCount++; if (waitCount <= 50) setTimeout(function(){attachGeoServiceControl(waitCount);}, 100);}
            }
            attachGeoServiceControl(0);
        } catch(e) {gclh_error("Add links to Google, OSM, Flopp's und GeoHack Map on GC Map",e);}
    }

// Hide found/hidden Caches on Map. Add Buttons for hiding/showing all Caches.
    if (document.location.href.match(/\.com\/map\//) && !$('#uxGoogleMapsSelect')[0] &&  // Nicht bei Screen Map Preferences.
        !document.location.href.match(/\.com\/map\/default.aspx\?pq/)) {  // Nicht bei PQ-Anzeige.
        try {
            function hideFoundCaches() {
                // Kartenfilter bei externen Filtern (beispielsweise aus play/search) nicht verändern.
                if (document.location.href.match(/&asq=/)) return;
                var button = unsafeWindow.document.getElementById("m_myCaches").childNodes[1];
                if (button) button.click();
            }
            if (settings_map_hide_found) isMapLoad(hideFoundCaches);
            function hideHiddenCaches() {
                if (document.location.href.match(/&asq=/)) return;
                var button = unsafeWindow.document.getElementById("m_myCaches").childNodes[3];
                if (button) button.click();
            }
            if (settings_map_hide_hidden) isMapLoad(hideHiddenCaches);
            function removeDNFSmileys() {
                if (document.location.href.match(/&asq=/)) return;
                var button = unsafeWindow.document.getElementById("m_myCaches").childNodes[5];
                if (button) button.click();
            }
            if (settings_map_hide_dnfs) isMapLoad(removeDNFSmileys);
            function getAllCachetypeButtons(){
                return ['Legend2', 'Legend9', 'Legend3', 'Legend6', 'Legend13', 'Legend453', 'Legend7005', 'Legend1304', 'Legend137', 'Legend4', 'Legend11', 'Legend8', 'Legend5', 'Legend1858'];
            }
            function hideAllCacheTypes(){
                var cacheTypes = getAllCachetypeButtons();
                cacheTypes.forEach(hideCacheType);
            }
            function hideCacheType(item){
                if (document.getElementById(item).className.indexOf('ct_untoggled') === -1) document.getElementById(item).click();
            }
            function showCacheType(item){
                if (document.getElementById(item).className.indexOf('ct_untoggled') !== -1) document.getElementById(item).click();
            }
            function showAllCacheTypes(){
                var cacheTypes = getAllCachetypeButtons();
                cacheTypes.forEach(showCacheType);
            }
            var ul = document.getElementById("m_cacheTypes");
            var li = document.createElement("li");
            var a = document.createElement('a');
            a.appendChild(document.createTextNode("Hide all Cachetypes"));
            a.title = "Hide all Caches";
            a.href = "#";
            li.appendChild(a);
            ul.appendChild(li);
            li.onclick = function() {hideAllCacheTypes();};
            li = document.createElement("li");
            a = document.createElement('a');
            a.appendChild(document.createTextNode("Show all Cachetypes"));
            a.title = "Show all Caches";
            a.href = "#";
            li.appendChild(a);
            ul.appendChild(li);
            li.onclick = function() {showAllCacheTypes();};
            // Apply Cache Type Filter.
            function hideCacheTypes() {
                if (document.location.href.match(/&asq=/)) return;
                // Cache Types auf hidden setzen.
                if (settings_map_hide_2    && $('#Legend2')[0])    {$('#Legend2')[0].click();    $('#Legend2')[0].setAttribute("class", "ct_toggle ct2 ct_untoggled");}
                if (settings_map_hide_9    && $('#Legend9')[0])    {$('#Legend9')[0].click();    $('#Legend9')[0].setAttribute("class", "ct_toggle ct9 ct_untoggled");}
                if (settings_map_hide_5    && $('#Legend5')[0])    {$('#Legend5')[0].click();    $('#Legend5')[0].setAttribute("class", "ct_toggle ct5 ct_untoggled");}
                if (settings_map_hide_3    && $('#Legend3')[0])    {$('#Legend3')[0].click();    $('#Legend3')[0].setAttribute("class", "ct_toggle ct3 ct_untoggled");}
                if (settings_map_hide_6    && $('#Legend6')[0])    {$('#Legend6')[0].click();    $('#Legend6')[0].setAttribute("class", "ct_toggle ct6 ct_untoggled");}
                if (settings_map_hide_453  && $('#Legend453')[0])  {$('#Legend453')[0].click();  $('#Legend453')[0].setAttribute("class", "ct_toggle ct453 ct_untoggled");}
                if (settings_map_hide_7005 && $('#Legend7005')[0]) {$('#Legend7005')[0].click(); $('#Legend7005')[0].setAttribute("class", "ct_toggle ct7005 ct_untoggled");}
                if (settings_map_hide_13   && $('#Legend13')[0])   {$('#Legend13')[0].click();   $('#Legend13')[0].setAttribute("class", "ct_toggle ct13 ct_untoggled");}
                if (settings_map_hide_1304 && $('#Legend1304')[0]) {$('#Legend1304')[0].click(); $('#Legend1304')[0].setAttribute("class", "ct_toggle ct1304 ct_untoggled");}
                if (settings_map_hide_4    && $('#Legend4')[0])    {$('#Legend4')[0].click();    $('#Legend4')[0].setAttribute("class", "ct_toggle ct4 ct_untoggled");}
                if (settings_map_hide_11   && $('#Legend11')[0])   {$('#Legend11')[0].click();   $('#Legend11')[0].setAttribute("class", "ct_toggle ct11 ct_untoggled");}
                if (settings_map_hide_137  && $('#Legend137')[0])  {$('#Legend137')[0].click();  $('#Legend137')[0].setAttribute("class", "ct_toggle ct137 ct_untoggled");}
                if (settings_map_hide_8    && $('#Legend8')[0])    {$('#Legend8')[0].click();    $('#Legend8')[0].setAttribute("class", "ct_toggle ct8 ct_untoggled");}
                if (settings_map_hide_1858 && $('#Legend1858')[0]) {$('#Legend1858')[0].click(); $('#Legend1858')[0].setAttribute("class", "ct_toggle ct1858 ct_untoggled");}
                // Gesamte Reihen zu den Cache Types auf hidden setzen.
                if (settings_map_hide_2) $('#LegendGreen')[0].childNodes[0].setAttribute("class", "a_cat_displayed cat_untoggled");
                if (settings_map_hide_3) $('#LegendYellow')[0].childNodes[0].setAttribute("class", "a_cat_displayed cat_untoggled");
                if (settings_map_hide_6 && settings_map_hide_453 && settings_map_hide_7005 && settings_map_hide_13) $('#LegendRed')[0].childNodes[0].setAttribute("class", "a_cat_displayed cat_untoggled");
                if (settings_map_hide_4 && settings_map_hide_11 && settings_map_hide_137) $('#chkLegendWhite')[0].childNodes[0].setAttribute("class", "a_cat_displayed cat_untoggled");
                if (settings_map_hide_8 && settings_map_hide_5 && settings_map_hide_1858) $('#chkLegendBlue')[0].childNodes[0].setAttribute("class", "a_cat_displayed cat_untoggled");
            }
            isMapLoad(hideCacheTypes);
        } catch(e) {gclh_error("Hide found/hidden Caches / Cache Types on Map",e);}
    }

// Display more informations on map popup for a cache
    if (document.location.href.match(/\.com\/map\//) && settings_show_enhanced_map_popup && getValue("gclhLeafletMapActive")) {
        try {
            var template = $("#cacheDetailsTemplate").html().trim();

            // {{=gc}} will be replaced by the GC-Code, so the div is unique
            var new_template = '';
                new_template += '<div id="popup_additional_info_{{=gc}}" class="links Clear popup_additional_info">';
                new_template += '    <div class="loading_container">';
                new_template += '        <img src="' + urlImages + 'ajax-loader.gif" />Loading additional Data...';
                new_template += '    </div>';
                new_template += '</div>';

            var pos = template.lastIndexOf('</div>');
            template = template.substring(0,pos) + new_template + '</div>';

            $("#cacheDetailsTemplate").html(template);

            // select the target node
            var target = document.querySelector('.leaflet-popup-pane');

            var css = "div.popup_additional_info {min-height: 70px;}"
                    + "div.popup_additional_info .loading_container{display: flex; justify-content: center; align-items: center;}"
                    + "div.popup_additional_info .loading_container img{margin-right:5px;}"
                    + "div.popup_additional_info span.favi_points svg, div.popup_additional_info span.tackables svg{position: relative;top: 4px;}";
            css += ".leaflet-popup-content-wrapper, .leaflet-popup-close-button {margin: 16px 3px 0px 13px;}";
            css += ".gclh_ctoc img {width: 14px; padding: 3px 1px 0 0; float: right;}";
            css += "div.gclh_latest_log {margin-top:5px;}";
            css += "div.gclh_latest_log:hover {position: relative;}";
            css += "div.gclh_latest_log span {display: none; position: absolute; left: 0px; width: 500px; padding: 5px; text-decoration:none; text-align:left; vertical-align:top; color: #000000;}";
            css += "div.gclh_latest_log:hover span {font-size: 13px; display: block; top: 16px; border: 1px solid #8c9e65; background-color:#dfe1d2; z-index:10000;}";
            css += "span.premium_only img {margin-right:0px;}";
            if (browser == 'firefox') css += ".gclh_owner {max-width: 110px;} .map-item h4 a {max-width: 265px;} .gclh_owner, .map-item h4 a {display: inline-block; white-space: nowrap; overflow: -moz-hidden-unscrollable; text-overflow: ellipsis;}";
            appendCssStyle(css);
            var global_ctoc_flag = false;
            var global_ctoc_cont = "";

            // create an observer instance
            var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    gccode = $('#gmCacheInfo .code').html();
                    if(gccode == null) return;
                    // Listing coordinates of all caches in additional popup.
                    var locations = [];
                    // Count of caches (map-items) in additional popup.
                    var countMapItems = $('.map-item').length;

                    // New Popup. This can contain more than one cache (if 2 or more are close together)
                    // so we have to load informations for all caches.
                    $('#gmCacheInfo .map-item').each(function () {
                        gccode = $(this).find('.code').html();

                        if ($('#already_loading_' + gccode)[0]) return;
                        $(this).find('dl dt')[0].innerHTML = "";
                        if (browser == 'firefox') {
                            $(this).find('h4 a')[0].title = $(this).find('h4 a')[0].innerHTML;
                            $(this).find('dl dd')[0].childNodes[0].innerHTML = '<span class="gclh_owner" title="' + $(this).find('dl dd')[0].childNodes[0].innerHTML + '">' + $(this).find('dl dd')[0].childNodes[0].innerHTML + '</span>';
                        }

                        // Add hidden Div, so we can know, that we are already loading data
                        $(this).find('#popup_additional_info_' + gccode).append('<div id="already_loading_' + gccode +'"></div>');

                        // Get index of map items.
                        var indexMapItems = $(this).find('#popup_additional_info_' + gccode).closest('.map-item')[0].className.match(/map-item-row-(\d+)/);
                        var indexMapItems = indexMapItems[1] -1;

                        $.get('https://www.geocaching.com/geocache/'+gccode, null, function(text){

                            // We need to retriev the gc_code from the loaded page, because in the
                            // meantime the global varioable gc_code could (and will be ;-)) changed
                            var local_gc_code = $(text).find('#ctl00_ContentBody_CoordInfoLinkControl1_uxCoordInfoCode').html();

                            var premium_only = false;
                            if($(text).find('p.Warning.NoBottomSpacing').html() != null){
                                premium_only = true;
                            }

                            // get the last logs
                            initalLogs_from_cachepage = text.substr(text.indexOf('initialLogs = {"status')+13, text.indexOf('} };') - text.indexOf('initialLogs = {"status') - 10);
                            var initalLogs = JSON.parse(initalLogs_from_cachepage);
                            var last_logs = document.createElement("div");
                            var last_logs_to_show = settings_show_latest_logs_symbols_count_map;
                            var lateLogs = new Array();
                            for (var i = 0; i < initalLogs['data'].length; i++) {
                                if (last_logs_to_show == i) break;
                                var lateLog = new Object();
                                lateLog['user'] = initalLogs['data'][i].UserName;
                                lateLog['src']  = '/images/logtypes/' + initalLogs['data'][i].LogTypeImage;
                                lateLog['type'] = initalLogs['data'][i].LogType;
                                lateLog['date'] = initalLogs['data'][i].Visited;
                                lateLog['log']  = initalLogs['data'][i].LogText;
                                lateLogs[i]     = lateLog;
                            }
                            if (lateLogs.length > 0) {
                                var div = document.createElement("div");
                                div.id = "gclh_latest_logs";
                                div.setAttribute("style", "padding-right: 0; padding-top: 5px; padding-bottom: 5px; display: flex;");

                                var span = document.createElement("span");
                                span.setAttribute("style", "white-space: nowrap; margin-right: 5px; margin-top: 5px;");
                                span.appendChild(document.createTextNode('Latest logs:'));
                                div.appendChild(span);
                                var inner_div = document.createElement("div");
                                inner_div.setAttribute("style", "display: flex; flex-wrap: wrap;");
                                div.appendChild(inner_div);
                                for (var i = 0; i < lateLogs.length; i++) {
                                    var div_log_wrapper = document.createElement("div");
                                    div_log_wrapper.className = "gclh_latest_log";
                                    var img = document.createElement("img");
                                    img.src = lateLogs[i]['src'];
                                    img.setAttribute("style", "padding-left: 2px; vertical-align: bottom; float:left;");
                                    var log_text = document.createElement("span");
                                    log_text.title = "";
                                    log_text.innerHTML = "<img src='" + lateLogs[i]['src'] + "'> <b>" + lateLogs[i]['user'] + " - " + lateLogs[i]['date'] + "</b><br>" + lateLogs[i]['log'];
                                    div_log_wrapper.appendChild(img);
                                    div_log_wrapper.appendChild(log_text);
                                    inner_div.appendChild(div_log_wrapper);
                                }
                                last_logs.appendChild(div);
                            }

                            // get all type of logs and their count
                            var all_logs = $(text).find('.LogTotals')[0].innerHTML.replace(/alt="(.*?)"/g, "alt=\"...\"");

                            // get the number of trackables in the cache
                            var trachables = 0;
                            // var tb_elements = $(text).find('.CacheDetailNavigationWidget').has('#ctl00_ContentBody_uxTravelBugList_uxInventoryLabel');
                            $(text).find('.CacheDetailNavigationWidget').each(function(){
                                tb_text = $(this).html();
                                if(tb_text.indexOf('ctl00_ContentBody_uxTravelBugList_uxInventoryLabel') !== -1){
                                    // There are two Container with .CacheDetailNavigationWidget so we are only processing the
                                    // one that contains the TB informations
                                    trachables = (tb_text.match(/<li>/g)||[]).length;
                                }
                            });

                            // get the number of favorite points
                            var fav_points = $(text).find('.favorite-value').html();
                            if(fav_points == null){
                                // couldn't get Number of Favorits. This happens with event caches for example
                                fav_points = 0;
                            }else{
                                fav_points = fav_points.replace('.','');
                                fav_points = fav_points.replace(',','');
                                fav_points = parseInt(fav_points);
                            }
                            // Set dummy favorite score.
                            var fav_percent = ' ';

                            // get the place, where the cache was placed
                            var place = $(text).find('#ctl00_ContentBody_Location')[0].innerHTML;

                            // Put all together
                            var new_text = '<span style="margin-right: 5px;">Logs:</span>' + all_logs.replace(/&nbsp;/g, " ") + '<br>';
                            new_text += $(last_logs).prop('outerHTML');
                            new_text += '<span title="Place">' + place + '</span> | ';
                            if (settings_show_elevation_of_waypoints) {
                                new_text += '<span id="elevation-waypoint-'+indexMapItems+'"></span>';
                            }
                            new_text += '<span class="favi_points" title="Favorites in percent"><svg height="16" width="16"><image xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/images/icons/fave_fill_16.svg" src="/images/icons/fave_fill_16.png" width="16" height="16" alt="Favorite points"></image></svg> ' + fav_percent + '</span> | ';
                            if(premium_only){
                                new_text += ' <span class="premium_only" title="Premium Only Cache"><img src="/images/icons/16/premium_only.png" width="16" height="16" alt="Premium Only Cache" /></span> | ';
                            }
                            new_text += '<span class="tackables" title="Number of trackables"><svg height="16" width="16" class="icon-sm"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/account/app/ui-icons/sprites/global.svg#icon-travelbug-default"></use></svg> ' + trachables + '</span><br>';
                            $('#popup_additional_info_' + local_gc_code).html(new_text);

                            // Get favorite score.
                            var from = text.indexOf('userToken', text.indexOf('MapTilesEnvironment')) + 13;
                            var length = text.indexOf("';", from) - from;
                            var userToken = text.substr(from, length);
                            getFavScore(local_gc_code, userToken);

                            // Get elevations.
                            if (settings_show_elevation_of_waypoints) {
                                var coords = toDec($(text).find('#uxLatLon')[0].innerHTML);
                                locations.push(coords[0]+","+coords[1]);
                                if (locations && locations.length == countMapItems) getElevations(0,locations);
                            }
                        });

                        // Improve Original Box Content
                        side = $(this).find('dl dd a');
                        guid = side.attr('href').substring(15,36+15);
                        username = side.text();

                        buildSendIcons(side[0], username, "per guid", guid);

                        var link = gclh_build_vipvup(username, global_vips, "vip");
                        link.children[0].style.marginLeft = "5px";
                        link.children[0].style.marginRight = "3px";
                        side[0].appendChild(link);
                        // Build VUP Icon.
                        if (settings_process_vup && username != global_activ_username) {
                            link = gclh_build_vipvup(username, global_vups, "vup");
                            link.children[0].setAttribute("style", "margin-left: 0px; margin-right: 0px");
                            side[0].appendChild(link);
                        }

                        // Copy GC code to clipboard.
                        var div = document.createElement('div');
                        div.className = "gclh_ctoc";
                        var code = gccode;
                        div.id = "gclh_ctoc_" + code;
                        div.innerHTML = '<a href="javascript:void(0);"><img src="'+global_copy_icon+'" title="Copy GC Code to clipboard"></a>';
                        $(this).find('h4')[0].parentNode.insertBefore(div, $(this).find('h4')[0]);
                        $(this).find('#gclh_ctoc_'+code)[0].addEventListener('click', function() {
                            // Tastenkombination Strg+c ausführen für eigene Verarbeitung.
                            global_ctoc_flag = true;
                            global_ctoc_cont = code;
                            document.execCommand('copy');
                        }, false);
                        document.addEventListener('copy', function(e){
                            // Normale Tastenkombination Strg+c für markierten Bereich nicht verarbeiten, nur eigene Tastenkombination Strg+c verarbeiten.
                            if (!global_ctoc_flag) return;
                            global_ctoc_flag = false;
                            // Gegebenenfalls markierter Bereich wird nicht beachtet.
                            e.preventDefault();
                            // GC Code verarbeiten.
                            e.clipboardData.setData('text/plain', global_ctoc_cont);
                            $('#gclh_ctoc_'+global_ctoc_cont)[0].style.opacity = '0.3';
                            setTimeout(function() { $('#gclh_ctoc_'+global_ctoc_cont)[0].style.opacity = 'unset'; }, 200);
                        });
                    });
                });
            });

            // configuration of the observer:
            var config = { attributes: true, childList: true, characterData: true };

            // pass in the target node, as well as the observer options
            observer.observe(target, config);

        } catch(e) {gclh_error("enhance cache popup",e);}
    }
    // Get favorite score.
    function getFavScore(gccode, userToken) {
       $.ajax({
           type: "POST",
           cache: false,
           url: '/datastore/favorites.svc/score?u=' + userToken,
           success: function (scoreResult) {
               var score = 0;
               if (scoreResult) score = scoreResult;
               if (score > 100) score = 100;
               var id = '#popup_additional_info_' + gccode + ' .favi_points';
               if ($(id)[0] && $(id)[0].childNodes[1]) $(id)[0].childNodes[1].data = " "+score+"%";
           }
       });
    }

// Leaflet Map für Trackables vergrößern und Zoom per Mausrad zulassen.
    if (document.location.href.match(/\.com\/track\/map/)) {
        try{
            $('#map_canvas').append('<div class="ui-resizable-handle ui-resizable-s" id="sgrip" style="width: 24px;height: 4px;background-color: transparent;border-top: 1px solid black;border-bottom: 1px solid black;bottom: 0px;left: 98%;transform: rotate(-45deg);"></div>');
            appendCssStyle('#map_canvas{ height: 450px;} .leaflet-bottom.leaflet-right {margin-right: 20px;}');
            var scriptText = "map.invalidateSize(); map.scrollWheelZoom.enable(); $('#map_canvas').resizable({handles: {'s': '#sgrip'}, minHeight: 300, maxHeight: 700, stop: function( event, ui ) {map.invalidateSize();}});";
            injectPageScript(scriptText, 'head');
        } catch(e) {gclh_error("tb_map_enhancement",e);}
    }

// Improve cache matrix on statistics page and public profile page and handle cache search links in list or map.
    try {
        if ((settings_count_own_matrix || settings_count_own_matrix_show_next) && isOwnStatisticsPage()) {
            var own = true;
        } else if (settings_count_foreign_matrix && is_page("publicProfile") && $('#ctl00_ContentBody_lblUserProfile')[0] && !$('#ctl00_ContentBody_lblUserProfile')[0].innerHTML.match(": " + global_me)) {
            var own = false;
        } else var own = "";
        if (own !== "") {
            // Matrix ermitteln.
            if (document.getElementById('ctl00_ContentBody_StatsDifficultyTerrainControl1_uxDifficultyTerrainTable')) {
                var table = document.getElementById('ctl00_ContentBody_StatsDifficultyTerrainControl1_uxDifficultyTerrainTable');
            } else if (document.getElementById("ctl00_ContentBody_ProfilePanel1_StatsDifficultyTerrainControl1_uxDifficultyTerrainTable")) {
                var table = document.getElementById("ctl00_ContentBody_ProfilePanel1_StatsDifficultyTerrainControl1_uxDifficultyTerrainTable");
            }
            if (table) {
                // Matrixerfüllung berechnen.
                var smallest = parseInt(table.getElementsByClassName("stats_cellfooter_grandtotal")[0].innerHTML);
                var count = 0;
                var cells = table.getElementsByTagName('td');
                for (var i = 0; i < cells.length; i++) {
                    var cell = cells[i];
                    if (cell.id.match(/^([1-9]{1})(_{1})([1-9]{1})$/)) {
                        if (parseInt(cell.innerHTML) == smallest) count++;
                        else if (parseInt(cell.innerHTML) < smallest) {
                            smallest = parseInt(cell.innerHTML);
                            count = 1;
                        }
                    }
                }
                // Matrixerfüllung ausgeben.
                if ((own == true && settings_count_own_matrix == true) || (own == false && settings_count_foreign_matrix == true)) {
                    if (smallest > 0) var matrix = " (" + smallest + " complete and (" + (81 - count) + "/81))";
                    else var matrix = " (" + (81 - count) + "/81)";
                    if (document.getElementById('uxDifficultyTerrainHelp').previousSibling) {
                        var side = document.getElementById('uxDifficultyTerrainHelp').previousSibling;
                        side.nodeValue += matrix;
                    }
                }
                // Nächste mögliche Matrix farblich kennzeichnen und Search Link und Title setzen.
                if (own == true && settings_count_own_matrix_show_next == true) {
                    var from = smallest;
                    var to = smallest - 1 + parseInt(settings_count_own_matrix_show_count_next);
                    var color = "#" + settings_count_own_matrix_show_color_next;
                    for (var i = 0; i < cells.length; i++) {
                        var cell = cells[i];
                        if (cell.id.match(/^([1-9]{1})(_{1})([1-9]{1})$/)) {
                            if (from <= parseInt(cell.innerHTML) && parseInt(cell.innerHTML) <= to) {
                                cell.style.color = "black";
                                var diff = parseInt(cell.innerHTML) - from;
                                cell.style.backgroundColor = color;
                                switch (diff) {
                                    case 1: cell.style.backgroundColor = cell.style.backgroundColor.replace(/rgb/i, "rgba").replace(/\)/, ",0.6)"); break;
                                    case 2: cell.style.backgroundColor = cell.style.backgroundColor.replace(/rgb/i, "rgba").replace(/\)/, ",0.4)"); break;
                                    case 3: cell.style.backgroundColor = cell.style.backgroundColor.replace(/rgb/i, "rgba").replace(/\)/, ",0.25)"); break;
                                }
                                if (settings_count_own_matrix_links_radius != 0) {
                                    var terrain = parseInt(cell.id.match(/^([1-9]{1})(_{1})([1-9]{1})$/)[3]) * 0.5 + 0.5;
                                    var difficulty = parseInt(cell.id.match(/^([1-9]{1})(_{1})([1-9]{1})$/)[1]) * 0.5 + 0.5;
                                    var user = global_me;
                                    var aTag = document.createElement('a');
                                    aTag.href = "/play/search/?origin=" + DectoDeg(getValue("home_lat"), getValue("home_lng"))
                                              + "&radius=" + settings_count_own_matrix_links_radius + "km"
                                              + "&t=" + terrain + "&d=" + difficulty + "&nfb[0]=" + user + "&f=2&o=2&nfb\[1\]=GClh";
                                    if (settings_count_own_matrix_links == "map") aTag.href += "#GClhMap";
                                    else aTag.href += "#searchResultsTable";
                                    aTag.title = "Search D" + difficulty + "/T" + terrain + " radius " + settings_count_own_matrix_links_radius + " km from home";
                                    aTag.target = "_blank";
                                    aTag.style.color = "black";
                                    aTag.appendChild(document.createTextNode(cell.innerHTML));
                                    cell.innerHTML = "";
                                    cell.appendChild(aTag);
                                }
                            }
                        }
                    }
                }
            }
        }
        // Handle cache search links in list or map.
        if (document.location.href.match(/\.com\/play\/search\/@(.*)&nfb\[1\]=GClh/)) {
            $('#map_container').remove();
            $('.selected-filters').remove();
            if (document.location.href.match(/#GClhMap/)) {
                if ($('.btn-map-these')[0]) {
                    location.replace($('.btn-map-these')[0].href);
                    $('.content-slide').remove();
                }
            }
        }
        if ($('#ctl00_ContentBody_ProfilePanel1_lnkStatistics').length == 0 && isOwnStatisticsPage()) appendCssStyle("dl.ProfileDataList dt {float: left; clear: both; margin-right: 10px;}");
    } catch(e) {gclh_error("Improve cache matrix",e);}

// Improve own statistics page and own profile page with own log statistic.
    if (settings_log_statistic && isOwnStatisticsPage()) {
        try {
            getLogSt("cache", "/my/logs.aspx?s=1");
            getLogSt("track", "/my/logs.aspx?s=2");
        } catch(e) {gclh_error("Improve own log statistic",e);}
    }
    function getLogSt(type, url, manual) {
        var logsName = (type == "cache" ? "Cache":"Trackable") + " logs";
        var logsId = "gclh_" + type + "_logs_";
        var get_last = parseInt(getValue(logsId + "get_last"), 10);
        if (!get_last) get_last = 0;
        var reload_after = (settings_log_statistic_reload === "" ? "0" : parseInt(settings_log_statistic_reload, 10) * 60 * 60 * 1000);
        var time = new Date().getTime();
        if ((reload_after != 0 && (get_last + reload_after) < time) || manual == true) {
            if (manual != true) setLogStHF(type, logsName, logsId, url);
            setLogStClear(type, logsName, logsId);
            setLogStAddWait(type, logsName, logsId);
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                onload: function(response) {
                    var logCount = new Array();
                    for (var i = 0; i < 101; i++) {
                        var count = response.responseText.match(new RegExp("/images/logtypes/" + i + ".png", "g"));
                        if (count) {
                            // Das "?" in "(.*?)" bedeutet "nicht gierig", das heißt es wird das erste Vorkommen verwendet.
                            var title = response.responseText.match('/images/logtypes/' + i + '.png"(.*?)title="(.*?)"');
                            if (title && title[2]) {
                                if (type == "track") {
                                    if      (i == 4)  var lt = "&lt=3";
                                    else if (i == 13) var lt = "&lt=5";
                                    else if (i == 14) var lt = "&lt=10";
                                    else if (i == 19) var lt = "&lt=2";
                                    else if (i == 48) var lt = "&lt=48";
                                    else if (i == 75) var lt = "&lt=75";
                                    else              var lt = "";
                                } else var lt = "&lt=" + i;
                                var logType = new Object();
                                logType["src"] = "/images/logtypes/" + i + ".png";
                                logType["title"] = title[2];
                                logType["href"] = url + lt;
                                logType["count"] = count.length;
                                logType["no"] = i;
                                logCount[logCount.length] = logType;
                            }
                        }
                    }
                    if (logCount.length > 0) setValue(logsId + "get_last", time);
                    setValue(logsId + "count", JSON.stringify(logCount));
                    var now = new Date().getTime();
                    var generated = Math.ceil((now - time) / (60 * 1000));  // In Minuten.
                    setLogStClear(type, logsName, logsId);
                    setLogSt(type, logsName, logsId, generated);
                }
            });
        } else if (reload_after == 0 && get_last == 0) {
            setLogStHF(type, logsName, logsId, url);
            setLogStDummy(type, logsName, logsId);
        } else {
            var generated = Math.ceil((time - get_last) / (60 * 1000));  // In Minuten.
            setLogStHF(type, logsName, logsId, url);
            setLogStClear(type, logsName, logsId);
            setLogSt(type, logsName, logsId, generated);
        }
    }
    function setLogStHF(type, logsName, logsId, url) {
        if ($('#ctl00_ContentBody_StatsChronologyControl1_YearlyBreakdown, #ctl00_ContentBody_ProfilePanel1_StatsChronologyControl1_YearlyBreakdown')[0]) {
            var side = $('#ctl00_ContentBody_StatsChronologyControl1_YearlyBreakdown, #ctl00_ContentBody_ProfilePanel1_StatsChronologyControl1_YearlyBreakdown')[0];
        }
        if (side) {
            var div = document.createElement("div");
            div.className = (type == "cache" ? "span-9":"span-9 last");
            var html = '';
            html += '<br> <h3> <a href="' + url + '" title="' + logsName + '" style="text-decoration: unset; color: rgb(89, 74, 66)" >Total ' + logsName + ':</a> </h3>';
            html += '<table class="Table">';
            html += '  <thead> <tr> <th scope="col"> Name </th> <th scope="col" class="AlignRight">' + (settings_log_statistic_percentage ? " % " : " ") + '</th> <th scope="col" class="AlignRight"> Count </th> </tr> </thead>';
            html += '  <tfoot style="font-style: normal;">';
            html += '    <tr><td><a href="' + url + '" title="' + logsName + '" style="text-decoration: unset; color: rgb(89, 74, 66)" >Total ' + logsName + ':</a></td>';
            html += '      <td id="' + logsId + 'percentage" class="AlignRight"></td>';
            html += '      <td id="' + logsId + 'total" class="AlignRight"></td></tr>';
            html += '    <tr><td style="background-color: unset; line-height: 1em;"><span id="' + logsId + 'generated" style="font-size: 11px;" ></span></td>';
            html += '      <td class="AlignRight" style="background-color: unset; line-height: 1em;"></td>';
            html += '      <td class="AlignRight" style="background-color: unset; line-height: 1em;"><a id="' + logsId + 'reload" href="javascript:void(0);" style="font-size: 11px;" ></a></td></tr>';
            html += '  </tfoot>';
            html += '  <tbody id="' + logsId + 'body"> </tbody>';
            html += '</table>';
            div.innerHTML = html;
            side.appendChild(div);
            $('#'+logsId+'reload')[0].addEventListener("click", function() {getLogSt(type, url, true);}, false);
        }
    }
    function setLogSt(type, logsName, logsId, generated) {
        var logCount = getValue(logsId + "count");
        if (logCount) logCount = JSON.parse(logCount.replace(/, (?=,)/g, ",null"));
        if (logCount.length > 0 && $('#'+logsId+'body')[0]) {
            var side = $('#'+logsId+'body')[0];
            logCount.sort(function(entryA, entryB) {
                if (entryA.count < entryB.count) return 1;
                if (entryA.count > entryB.count) return -1;
                return 0;
            });
            var total = 0;
            logCount.forEach(function(entry) {total += entry.count;});
            for (var i = 0; i < logCount.length; i++) {
                var tr = document.createElement("tr");
                var html = '';
                html += '<td class="AlignLeft">';
                html += '  <a title="' + logCount[i]["title"] + ' logs" href="' + logCount[i]["href"] + '" style="text-decoration: unset;" >';
                html += '    <img src="' + logCount[i]["src"] + '" style="vertical-align: sub;" >';
                html += '    <span style="text-decoration: underline; margin-left: 4px;" >' + logCount[i]["title"] + '</span>';
                html += '  </a>';
                html += '</td>';
                html += '<td class="AlignRight"> <span>' + (settings_log_statistic_percentage ? (Math.round(logCount[i]["count"] * 100 * 100 / total) / 100).toFixed(2) : "") + '</span> </td>';
                html += '<td class="AlignRight"> <span>' + logCount[i]["count"] + '</span> </td>';
                tr.innerHTML = html;
                side.appendChild(tr);
            }
            if ($('#'+logsId+'total')[0]) $('#'+logsId+'total')[0].innerHTML = total;
            if ($('#'+logsId+'generated')[0]) {
                $('#'+logsId+'generated')[0].innerHTML = "Generated " + buildTimeString(generated) + " ago";
                var reload_after = parseInt(settings_log_statistic_reload, 10) * 60;
                if (reload_after > 0) $('#'+logsId+'generated')[0].title = "Automated reload in " + buildTimeString(reload_after - generated);
            }
            if ($('#'+logsId+'reload')[0]) {
                $('#'+logsId+'reload')[0].innerHTML = "Reload";
                $('#'+logsId+'reload')[0].title = "Reload " + logsName;
            }
        } else setLogStDummy(type, logsName, logsId);
    }
    function buildTimeString(min) {
        if      (min < 2)    return (min + " minute");
        else if (min < 121)  return (min + " minutes");
        else if (min < 2881) return ("more than " + Math.floor(min / 60) + " hours");
        else                 return ("more than " + Math.floor(min / (60*24)) + " days");
    }
    function setLogStClear(type, logsName, logsId) {
        $('#'+logsId+'body').children().each(function() {this.remove();});
        if ($('#'+logsId+'total')[0]) $('#'+logsId+'total')[0].innerHTML = "";
        if ($('#'+logsId+'generated')[0]) $('#'+logsId+'generated')[0].innerHTML = $('#'+logsId+'generated')[0].title = "";
        if ($('#'+logsId+'reload')[0]) $('#'+logsId+'reload')[0].innerHTML = $('#'+logsId+'reload')[0].title = "";
    }
    function setLogStAddWait(type, logsName, logsId) {
        if ($('#'+logsId+'body')[0]) {
            var side = $('#'+logsId+'body')[0];
            var load = document.createElement("span");
            load.setAttribute("style", "line-height: 36px; margin-left: 5px;");
            load.innerHTML = '<img src="/images/loading2.gif" title="Loading" alt="Loading" style="vertical-align: sub;" />  Loading ' + logsName + ' ...';
            side.appendChild(load);
        }
    }
    function setLogStDummy(type, logsName, logsId) {
        if ($('#'+logsId+'body')[0]) {
            var side = $('#'+logsId+'body')[0];
            var dummy = document.createElement("span");
            dummy.setAttribute("style", "margin-left: 5px;");
            side.appendChild(dummy);
        }
        if ($('#'+logsId+'reload')[0]) {
            $('#'+logsId+'reload')[0].innerHTML = "Load";
            $('#'+logsId+'reload')[0].title = "Load " + logsName;
        }
    }

// Improve own statistic map page with links to caches for every country.
    if (settings_map_links_statistic && isOwnStatisticsPage() ) {

        try {
            var countriesList = $('#stats_tabs-maps .StatisticsWrapper');
            for (var j = 0; j < countriesList.length; j++) {
                var indecator = $(countriesList[j]).find('#StatsFlagLists p span');
                var tableItems = $(countriesList[j]).find('#StatsFlagLists table.Table tr');

                for (var i = 0; i < tableItems.length; i++) {
                    var name = tableItems[i].children[0].childNodes[1].textContent;
                    if (name) {
                        var parameter = undefined;
                        var item = undefined;

                        var countries = $.grep(country_id, function(e){return e.n == name;});
                        var states = $.grep(states_id, function(e){return e.n == name;});

                        /* ambiguous matches of state (or country) name are not handled. Known cases:
                            Distrito Federal - Mexiko: Distrito Federal (state) / Brazil: Distrito Federal (state)
                            Limburg    - Belgium: Limburg (state) / Netherlands: Limburg (state)
                        */
                        if        (  (countries && countries[0]) && !(states && states[0]) ) {
                            parameter = "c";
                            item = countries;
                        } else if ( !(countries && countries[0]) &&  (states && states[0]) ) {
                            parameter = "r";
                            item = states;
                        /* case: country/state */
                        } else if (  (countries && countries[0]) &&  (states && states[0]) ) {
                            /* Known case: Georgia - United States/Georgia (state) and Georgia (country) */
                            if ( indecator[0].getAttribute("id") == "ctl00_ContentBody_ProfilePanel1_USMapControl1_uxTotalCount") {
                                parameter = "r";
                                item = states;
                            } else {
                                /* Main rule: country first
                                 Known case: Luxembourg - Luxembourg (country) / Belgium: Luxembourg (state) */
                                parameter = "c";
                                item = countries;
                            }
                        } else {
                            // do nothing
                            gclh_log("Improve own statistic map page: country and state name not found");
                            continue;
                        }

                        if (item && item[0]) {
                            var a = document.createElement("a");
                            a.setAttribute("title", "Show caches you have found in " + item[0]["n"]);
                            a.setAttribute("href", "/play/search?ot=4&"+parameter+"=" + item[0]["id"] + "&f=1&sort=FoundDate&asc=True#myListsLink");
                            a.setAttribute("style", "color: #3d76c5;");
                            a.innerHTML = tableItems[i].children[0].innerHTML;
                            tableItems[i].children[0].innerHTML = "";
                            tableItems[i].children[0].appendChild(a);
                        }
                    }
                }
            }
        } catch(e) {gclh_error("Improve own statistic map page",e);}
    }

// Post log from listing (inline).
    try {
        // iframe aufbauen und verbergen.
        if (settings_log_inline && is_page("cache_listing") && $('#ctl00_ContentBody_bottomSection')[0] && $('#ctl00_ContentBody_bottomSection')[0].children[0]) {
            var links = document.getElementsByTagName('a');
            var menu = false;
            var watch = false;
            var gallery = false;
            for (var i = 0; i < links.length; i++) {
                if (links[i].href.match(/log\.aspx\?ID/) && !menu) {
                    menu = links[i];
                } else if (links[i].href.match(/gallery\.aspx/) && !gallery && links[i].parentNode.tagName.toLowerCase() == "li") {
                    gallery = links[i];
                } else if (links[i].href.match(/watchlist\.aspx/) && !watch) {
                    watch = links[i];
                }
            }
            var head = document.getElementById("ctl00_ContentBody_bottomSection").children[0];
            function hide_iframe() {
                var frame = document.getElementById('gclhFrame');
                if (frame.style.display == "") frame.style.display = "none";
                else frame.style.display = "";
            }
            if (head && menu) {
                var match = menu.href.match(/\?ID=(.*)/);
                if (match && match[1]) {
                    var iframe = document.createElement("iframe");
                    iframe.setAttribute("id", "gclhFrame");
                    iframe.setAttribute("width", "100%");
                    iframe.setAttribute("height", "600px");
                    iframe.setAttribute("style", "border-top: 1px solid #b0b0b0; border-right: 0px; border-bottom: 1px solid #b0b0b0; border-left: 0px; overflow: auto; display: none;");
                    iframe.setAttribute("src", "/seek/log.aspx?ID=" + match[1] + "&gclh=small");
                    var a = document.createElement("a");
                    a.setAttribute("href", "#gclhLogIt");
                    a.setAttribute("name", "gclhLogIt");
                    var img = document.createElement("img");
                    img.setAttribute("src", global_log_it_icon);
                    img.setAttribute("style", "margin-left: -10px;");
                    img.setAttribute("border", "0");
                    a.appendChild(img);
                    a.addEventListener("click", hide_iframe, false);
                    head.parentNode.insertBefore(a, head);
                    head.parentNode.insertBefore(iframe, head);
                }
                var a = document.createElement("a");
                a.setAttribute("href", "#gclhLogIt");
                a.setAttribute("class", "lnk");
                a.setAttribute("style", "padding:0px;");
                a.innerHTML = "<img src='/images/stockholm/16x16/comment_add.gif'> <span style='padding-left:4px;'>Log your visit (inline)</span>";
                a.addEventListener("click", hide_iframe, false);
                var li = document.createElement('li');
                li.appendChild(a);
                var link = false;
                if (gallery) link = gallery;
                else link = watch;
                if (link) link.parentNode.parentNode.insertBefore(li, link.parentNode);
            }
        }
        // Im aufgebauten iframe, quasi nicht im Cache Listing. Nur auf old log page Veränderungen vornehmen.
        if (document.location.href.match(/\.com\/seek\/log\.aspx\?(.*)\&gclh\=small/)) hideForInlineLogging();
    } catch(e) {gclh_error("Post log from listing (inline)",e);}
// Post log from PMO-Listing as Basic Member (inline).
    try {
        // iframe aufbauen und verbergen.
        if (settings_log_inline_pmo4basic && is_page("cache_listing") && $('.ul__cache-details.unstyled')[0]) {
            function hide_iframe() {
                var frame = document.getElementById('gclhFrame');
                if (frame.style.display == "") frame.style.display = "none";
                else frame.style.display = "";
            }
            var idParameter = null;
            if (document.URL.match(/wp=[a-zA-Z0-9]*|guid=[a-zA-Z0-9-]*|id=[0-9]*/)) idParameter = document.URL.match(/wp=[a-zA-Z0-9]*|guid=[a-zA-Z0-9-]*|id=[0-9]*/)[0];
            if (!idParameter | idParameter == "") idParameter = "wp=" + document.URL.match(/\/geocache\/([^_]*)/)[1];
            var iframe = document.createElement("iframe");
            iframe.setAttribute("id", "gclhFrame");
            iframe.setAttribute("width", "100%");
            iframe.setAttribute("height", "600px");
            iframe.setAttribute("style", "margin-bottom: 50px; border-top: 1px solid #b0b0b0; border-right: 0px; border-bottom: 1px solid #b0b0b0; border-left: 0px; overflow: auto; display: none;");
            iframe.setAttribute("src", "/seek/log.aspx?" + idParameter + "&gclh=small");
            var a = document.createElement("a");
            a.setAttribute("href", "#gclhLogIt");
            a.setAttribute("name", "gclhLogIt");
            a.setAttribute("style", "border-bottom: 0px;");
            var img = document.createElement("img");
            img.setAttribute("src", global_log_it_icon);
            img.setAttribute("style", "margin-left: 350px; margin-top: 40px; margin-bottom: 50px;");
            img.setAttribute("border", "0");
            a.appendChild(img);
            a.addEventListener("click", hide_iframe, false);
            var banner = $('.ul__cache-details.unstyled')[0].parentNode.nextSibling;
            banner.parentNode.insertBefore(a, banner);
            banner.parentNode.insertBefore(iframe, banner);
        }
        // Im aufgebauten iframe, quasi nicht im Cache Listing. Nur auf old log page Veränderungen vornehmen.
        if (document.location.href.match(/\.com\/seek\/log\.aspx\?(.*)\&gclh\=small/)) hideForInlineLogging(true);
    } catch(e) {gclh_error("Post log from PMO-Listing as Basic Member (inline)",e);}
    // Hide for both inline loggings.
    function hideForInlineLogging(pmo) {
        if ($('html')[0]) $('html')[0].style.backgroundColor = "#FFFFFF";
        if ($('header')[0]) $('header')[0].style.display = "none";
        if ($('#ctl00_divBreadcrumbs')[0]) $('#ctl00_divBreadcrumbs')[0].style.display = "none";
        if ($('.BottomSpacing')[0]) $('.BottomSpacing')[0].style.display = "none";
        if ($('.BottomSpacing')[1]) $('.BottomSpacing')[1].style.display = "none";
        if ($('#divAdvancedOptions')[0]) $('#divAdvancedOptions')[0].style.display = "none";
        if (!settings_log_inline_tb && $('#ctl00_ContentBody_LogBookPanel1_TBPanel')[0]) $('#ctl00_ContentBody_LogBookPanel1_TBPanel')[0].style.display = "none";
        if ($('#ctl00_ContentBody_uxVistOtherListingLabel')[0]) $('#ctl00_ContentBody_uxVistOtherListingLabel')[0].style.display = "none";
        if ($('#ctl00_ContentBody_uxVistOtherListingGC')[0]) $('#ctl00_ContentBody_uxVistOtherListingGC')[0].style.display = "none";
        if ($('#ctl00_ContentBody_uxVisitOtherListingButton')[0]) $('#ctl00_ContentBody_uxVisitOtherListingButton')[0].style.display = "none";
        if ($('#ctl00_divContentSide')[0]) $('#ctl00_divContentSide')[0].style.display = "none";
        if ($('#UtilityNav')[0]) $('#UtilityNav')[0].style.display = "none";
        if ($('footer')[0]) $('footer')[0].style.display = "none";
        if ($('.container')[1]) $('.container')[1].style.display = "inline";
        var links = document.getElementsByTagName("a");
        for (var i = 0; i < links.length; i++) {
            if (!links[i].id.match(/(AllDroppedOff|AllVisited|AllClear)/i)) links[i].setAttribute("target", "_blank");
        }
        var css = "";
        if (pmo) css += "#Content, #Content .container, .span-20 {width: 780px;}";
        else {
            css += "#Content, #Content .container, .span-20 {width: " + (parseInt(getValue("settings_new_width")) - 60) + "px;}";
            if ($('#Navigation')[0]) $('#Navigation')[0].style.display = "none";
        }
        css += ".PostLogList .Textarea {height: 175px;}";
        appendCssStyle(css);
    }

// Show amount of different coins in public profile.
    if (is_page("publicProfile") && $('#ctl00_ContentBody_ProfilePanel1_lnkCollectibles.Active')[0]) {
        try {
            function gclh_coin_stats(table_id) {
                var table = $('#'+table_id+' table');
                var rows = table.find('tbody').first().find('tr');
                var sums = new Object();
                sums["tbs"] = sums["coins"] = sums["patches"] = sums["signal"] = sums["unknown"] = 0;
                var diff = new Object();
                diff["tbs"] = diff["coins"] = diff["patches"] = diff["signal"] = diff["unknown"] = 0;
                for (var i = 0; i < (rows.length - 1); i++) {
                    if (rows[i].innerHTML.match(/travel bug/i)) {
                        diff["tbs"]++;
                        sums["tbs"] += parseInt(rows[i].childNodes[5].innerHTML, 10);
                    } else if (rows[i].innerHTML.match(/geocoin/i)) {
                        diff["coins"]++;
                        sums["coins"] += parseInt(rows[i].childNodes[5].innerHTML, 10);
                    } else if (rows[i].innerHTML.match(/geopatch/i)) {
                        diff["patches"]++;
                        sums["patches"] += parseInt(rows[i].childNodes[5].innerHTML, 10);
                    } else if (rows[i].innerHTML.match(/signal/i)) {
                        diff["signal"]++;
                        sums["signal"] += parseInt(rows[i].childNodes[5].innerHTML, 10);
                    } else {
                        diff["unknown"]++;
                        sums["unknown"] += parseInt(rows[i].childNodes[5].innerHTML, 10);
                    }
                }
                var tfoot = table.find('tfoot')[0];
                var tr = document.createElement("tr");
                var td = document.createElement("td");
                var new_table = "";
                td.colSpan = 3;
                new_table += "<table>";
                new_table += "  <tr><td></td>";
                new_table += "    <td><b>Sum</b></td>";
                new_table += "    <td><b>Different</b></td></tr>";
                new_table += "  <tr><td><b>Travel Bugs:</b></td>";
                new_table += "    <td style='text-align: center;'>" + sums["tbs"] + "</td>";
                new_table += "    <td style='text-align: center;'>" + diff["tbs"] + "</td></tr>";
                new_table += "  <tr><td><b>Geocoins:</b></td>";
                new_table += "    <td style='text-align: center;'>" + sums["coins"] + "</td>";
                new_table += "    <td style='text-align: center;'>" + diff["coins"] + "</td></tr>";
                new_table += "  <tr><td><b>Geopatches:</b></td>";
                new_table += "    <td style='text-align: center;'>" + sums["patches"] + "</td>";
                new_table += "    <td style='text-align: center;'>" + diff["patches"] + "</td></tr>";
                new_table += "  <tr><td><b>Signal Tags:</b></td>";
                new_table += "    <td style='text-align: center;'>" + sums["signal"] + "</td>";
                new_table += "    <td style='text-align: center;'>" + diff["signal"] + "</td></tr>";
                if (sums["unknown"] > 0 || diff["unknown"] > 0) {
                    new_table += "  <tr><td><b>Unknown:</b></td>";
                    new_table += "    <td style='text-align: center;'>" + sums["unknown"] + "</td>";
                    new_table += "    <td style='text-align: center;'>" + diff["unknown"] + "</td></tr>";
                    new_table += "</table>";
                }
                td.innerHTML = new_table;
                tr.appendChild(td);
                tfoot.appendChild(tr);
            }
            if ($('#ctl00_ContentBody_ProfilePanel1_dlCollectibles')[0]) gclh_coin_stats("ctl00_ContentBody_ProfilePanel1_dlCollectibles");
            if ($('#ctl00_ContentBody_ProfilePanel1_dlCollectiblesOwned')[0]) gclh_coin_stats("ctl00_ContentBody_ProfilePanel1_dlCollectiblesOwned");
        } catch(e) {gclh_error("Show Coin-Sums",e);}
    }

// Show Coin Series in TB-Listing.
    if (document.location.href.match(/\.com\/track\/details\.aspx/)) {
        try {
            if ($('#ctl00_ContentBody_BugTypeImage')[0] && $('#ctl00_ContentBody_BugTypeImage')[0].alt && $('.BugDetailsList')[0]) {
                var dl = $('.BugDetailsList')[0];
                var dt = document.createElement("dt");
                var dd = document.createElement("dd");
                dt.innerHTML = "Series:";
                dd.innerHTML = $('#ctl00_ContentBody_BugTypeImage')[0].alt;
                dl.appendChild(dt);
                dl.appendChild(dd);
            }
        } catch(e) {gclh_error("Show Coin Series",e);}
    }

// Improve favorites and profile lists page.
    if (document.location.href.match(/\.com\/my\/favorites\.aspx/) && $('table.Table tbody tr')[0]) {
        try {
            // Count favorite points.
            buildFavSum();
            // No line-breaks in column location.
            if (settings_new_width >= 1000) appendCssStyle('table.Table tbody tr td:nth-child(4) {white-space: nowrap;}');
        } catch(e) {gclh_error("Count favorite points",e);}
    }
    if (is_page("publicProfile") && $('#ctl00_ContentBody_ProfilePanel1_lnkLists.Active')[0] && $('table.Table tbody tr')[0]) {
        try {
            // Sum up FP and BM entries.
            $('#ctl00_ContentBody_ProfilePanel1_pnlBookmarks h3').each(function(i, e) {
                $(e).text($(e).text() + ' (' + $(e).next().find('tbody tr').length + ')');
            });
            // Count favorite points.
            buildFavSum(true);
            // No line-breaks in column location.
            if (settings_new_width >= 1000) appendCssStyle('table.Table tbody tr td:nth-child(3) {white-space: nowrap;}');
        } catch(e) {gclh_error("Sum up FP and BM entries, count favorite points",e);}
    }
    function buildFavSum(pp) {
        function buildSL(tag) {
            var tr = document.createElement('tr');
            var t = '<'+tag+' style="background-color: #DFE1D2; font-weight: normal; font-size: 1em;">';
            if (pp) var html = t+'</'+tag+'>'+t;
            else var html = t+'</'+tag+'>'+t+'</'+tag+'>'+t;
            for (src in stats) {html += ' <img src="'+src+'"> '+stats[src];}
            html += '<span style="float: right">Sum: '+count+'</'+tag+'>'+t+'</'+tag+'>';
            tr.innerHTML = html;
            return tr;
        }
        var imgs = $('table.Table tbody').first().find('tr a:not([href*="mail"],[href*="message"])').find('img');
        var stats = new Object();
        var count = 0;
        for (var i = 0; i < imgs.length; i++) {
            if (imgs[i].src) {
                if (!stats[imgs[i].src]) stats[imgs[i].src] = 0;
                stats[imgs[i].src]++;
                count++;
            }
        }
        tr = buildSL("td", pp);
        $('table.Table tbody')[0].append(tr);
        tr = buildSL("th",pp);
        $('table.Table thead')[0].append(tr);
    }

// Hide side rights on print page.
    if (document.location.href.match(/\.com\/seek\/cdpf\.aspx/)) {
        try {
            if ($('#Footer')[0]) $('#Footer')[0].remove();
        } catch(e) {gclh_error("Hide side rights on print page",e);}
    }

// Hide feedback icon.
    if (settings_hide_feedback_icon) {
        try {
            function hideFbIcon(waitCount) {
                if ($('#_hj_feedback_container')[0]) $('#_hj_feedback_container')[0].style.display = "none";
                waitCount++;
                if (waitCount <= 50) setTimeout(function(){hideFbIcon(waitCount);}, 200);
            }
            hideFbIcon(0);
        } catch(e) {gclh_error("Hide feedback icon",e);}
    }

// Edit and Image Links to own caches in profile.
    if (document.location.href.match(/\.com\/my\/owned\.aspx/)) {
        try {
            var links = $('a');
            for (var i = 0; i < links.length; i++) {
                if (links[i].href.match(/\/seek\/cache_details\.aspx\?/)) {
                    if (!$(links[i]).find('img').length) {
                        var match = links[i].href.match(/\/seek\/cache_details\.aspx\?guid=(.*)/);
                        if (match[1]) {
                            links[i].parentNode.innerHTML += " <a href='/hide/report.aspx?guid=" + match[1] + "'><img src='/images/stockholm/16x16/page_white_edit.gif'></a> <a href='/seek/gallery.aspx?guid=" + match[1] + "'><img src='/images/stockholm/16x16/photos.gif'></a>";
                        }
                    }
                }
            }
        } catch(e) {gclh_error("Edit and Image Links to own caches in profile",e);}
    }

// Hide archived at own caches.
    if (settings_hide_archived_in_owned && document.location.href.match(/\.com\/my\/owned\.aspx/)) {
        try {
            var links = $('a');
            for (var i = 0; i < links.length; i++) {
                if (links[i].href.match(/\/seek\/cache_details\.aspx\?/)) {
                    var archived = links[i].classList.contains("OldWarning");
                    if (archived) links[i].parentNode.parentNode.style.display = 'none';
                }
            }
        } catch(e) {gclh_error("Hide archived at own caches",e);}
    }

// Werden nicht alle eigenen Logs geladen, weil z.B. über Browser gestoppt, dann Anzahl Logs geladen und Datum letztes Log angeben.
    if (document.location.href.match(/\.com\/my\/logs\.aspx?/)) {
        if ($('#divContentMain')[0] && $('#divContentMain')[0].children[2] && $('tr')[0]) {
            try {
                var result = $('#divContentMain')[0].children[2];
                var count = result.innerHTML.match(/\s+(\d+)\s+/);
                if (count) {
                    var loaded = $('tr').length;
                    if (parseInt(count[1]) > loaded) {
                        if ($('tr')[loaded-1].children[2] && $('tr')[loaded-1].children[2].innerHTML.match(/(\S+)/)) var lastLog = loaded-1;
                        else if ($('tr')[loaded-2].children[2] && $('tr')[loaded-2].children[2].innerHTML.match(/(\S+)/)) var lastLog = loaded-2;
                        else var lastLog = "";
                        if (lastLog != "") var dateLastLog =  ". Last date is " + $('tr')[lastLog].children[2].innerHTML.replace(/\s/g, "");
                        else var dateLastLog = "";
                        result.innerHTML = result.innerHTML + " (Only " + loaded + " logs loaded" + dateLastLog + ".)";
                    }
                }
            } catch(e) {gclh_error("Stopped logs loading",e);}
        }
    }

// Add selectable month and year in calendar of cache and trackable logs.
    function onChangeCalendarSelect(event) {
        const selectedYear = $("#selectYearEl").val();
        const selectedMonth = $("#selectMonthEl").val();
        const ONE_DAY = 1000 * 60 * 60 * 24;
        const GC_ERA_MS = new Date(2000, 0, 2).getTime();
        const selectedDate = new Date(selectedYear, selectedMonth, 1);
        const difference_ms = Math.abs(selectedDate.getTime() - GC_ERA_MS);
        const daysFromGCEra = Math.round(difference_ms/ONE_DAY) + 1;
        __doPostBack('ctl00$ContentBody$MyCalendar', 'V'+daysFromGCEra);
    }
    function appendOptionalEl(selectEl, value, text, isSelected) {
        const optEl = document.createElement("option");
        optEl.setAttribute("value", value);
        if (isSelected) optEl.setAttribute("selected", "selected");
        const textNode = document.createTextNode(text);
        optEl.appendChild(textNode);
        selectEl.appendChild(optEl);
    }
    if (document.location.href.match(/\.com\/my\/geocaches\.aspx/) || document.location.href.match(/\.com\/my\/travelbugs\.aspx/)) {
        try {
            const selectYearEl = document.createElement("select");
            selectYearEl.id = 'selectYearEl';
            selectYearEl.onchange = onChangeCalendarSelect;
            const selectMonthEl = document.createElement("select");
            selectMonthEl.id = 'selectMonthEl';
            selectMonthEl.onchange = onChangeCalendarSelect;
            var calendarHeaderElements = $("#ctl00_ContentBody_MyCalendar").find("tbody tr:first td table tbody tr td:nth-child(2)");
            if (calendarHeaderElements.length > 0) {
                var selectedCalendar = calendarHeaderElements.text().split(" ");
                var CURRENT_YEAR = selectedCalendar[0];
                var CURRENT_MONTH = selectedCalendar[1];
                calendarHeaderElements.empty();
                calendarHeaderElements.append(selectYearEl);
                calendarHeaderElements.append(document.createTextNode(" "));
                calendarHeaderElements.append(selectMonthEl);
                const LAST_YEAR = new Date().getFullYear();
                for(var year = 2000; year <= LAST_YEAR; year++) {
                    appendOptionalEl(selectYearEl, year, year, (year == CURRENT_YEAR));
                }
                for(var month = 0; month < 12; month++) {
                    var objDate = new Date();
                    objDate.setMonth(month);
                    var locale = "en-us";
                    var monthText = objDate.toLocaleString(locale, { month: "long" });
                    appendOptionalEl(selectMonthEl, month, monthText, (monthText == CURRENT_MONTH));
                }
            }
            appendCssStyle('select {color: #594a42;}');
        } catch(e) {gclh_error("Add selectable month and year in calendar",e);}
    }

// Show warning for not available images.
    if (settings_img_warning && is_page("cache_listing")) {
        try {
            // Images in listing.
            function checkImage(element, newUrl, oldUrl) {
                var img = new Image();
                img.onerror =
                    function(){
                        var hlp = element.title + '\n\n';
                        element.title = hlp.trim() + element.src;
                        element.src = newUrl;
                        element.ondblclick =
                            function(){
                                alert('Original image URL:\n\n' + oldUrl);
                            };
                    };
                img.src = element.src;
            }
            // Background image.
            function checkBGImage(element, newUrl) {
                var img = new Image();
                if (element.background.length == 0) return;
                img.onerror =
                    function(){
                        element.background = newUrl;
                    };
                img.src = element.background;
            }
            // Check images in listing.
            var a = $('#ctl00_ContentBody_ShortDescription img, #ctl00_ContentBody_LongDescription img');
            for (var i = 0; i < a.length; i++) {
                checkImage(a[i], urlImagesSvg+'image_not_available.svg', a[i].src);
            }
            // Check background image.
            var a = $('body');
            for (var i = 0; i < a.length; i++) {
                checkBGImage(a[i], urlImagesSvg+'image_not_available_background.svg');
            }
        } catch(e) {gclh_error("Show warning for not available images",e);}
    }

// Save home coords.
    if (document.location.href.match(/\.com\/account\/settings\/homelocation/)) {
        try {
            function saveHomeCoordsWait(waitCount) {
                if ($('#Query')[0]) {
                    saveHomeCoords();
                    $('#Query')[0].addEventListener('change', saveHomeCoords, false);
                } else {waitCount++; if (waitCount <= 20) setTimeout(function(){saveHomeCoordsWait(waitCount);}, 100);}
            }
            saveHomeCoordsWait(0);
        } catch(e) {gclh_error('Save Homecoords',e);}
    }
    function saveHomeCoords() {
        var link = $('#Query')[0];
        if (link) {
            var match = link.value.match(/((N|S) ([0-9]+)° ([0-9]+)\.([0-9]+)′ (E|W) ([0-9]+)° ([0-9]+)\.([0-9]+)′)/);
            if (match && match[1]) {
                match[1] = match[1].replace(/′/g, '');
                var latlng = toDec(match[1]);
                if (getValue('home_lat', 0) != parseInt(latlng[0] * 10000000)) setValue('home_lat', parseInt(latlng[0] * 10000000));
                if (getValue('home_lng', 0) != parseInt(latlng[1] * 10000000)) setValue('home_lng', parseInt(latlng[1] * 10000000));
            }
        }
    }

// Save trackable uid from dashboard.
    if (is_page("profile") || is_page("dashboard")) {
       try {
            var link = $('a[href*="/track/search.aspx?o=1&uid="]')[0];
            if (link) {
                var uid = link.href.match(/\/track\/search\.aspx\?o=1\&uid=(.*)/);
                if (uid && uid[1]) {
                    if (getValue("uid", "") != uid[1]) setValue("uid", uid[1]);
                }
            }
        } catch(e) {gclh_error("Save uid",e);}
    }

// Add mailto link to profilpage.
    if (is_page("publicProfile") && $('#ctl00_ContentBody_ProfilePanel1_lnkEmailUser')[0]) {
        try {
            var link = $('#ctl00_ContentBody_ProfilePanel1_lnkEmailUser')[0];
            if (link && link.innerHTML.match(/^.+@.+\..+$/)) {
                var mailto = document.createElement('a');
                mailto.href = "mailto:" + link.innerHTML + '?subject=[GC]';
                mailto.appendChild(document.createTextNode("(@)"));
                link.parentNode.appendChild(document.createTextNode(" "));
                link.parentNode.appendChild(mailto);
            }
        } catch(e) {gclh_error("Add mailto-link to profilepage",e);}
    }

// Hide GC Avatar Option.
    if (settings_load_logs_with_gclh && document.location.href.match(/\.com\/account\/settings\/preferences/) && $('#ShowAvatarsInCacheLogs')[0]) {
        try {
            var check = $('#ShowAvatarsInCacheLogs')[0];
            check.checked = !settings_hide_avatar;
            check.disabled = true;
            var head = check.parentNode;
            head.style.cursor = "unset";
            head.style.opacity = "0.5";
            var link = document.createElement("a");
            link.setAttribute("href", "/my/default.aspx#GClhShowConfig#a#settings_hide_avatar");
            link.appendChild(document.createTextNode("here"));
            var hinweis = document.createElement("span");
            hinweis.setAttribute("class", "label");
            hinweis.appendChild(document.createTextNode("You are using \"" + scriptName + "\" - you have to change this option "));
            hinweis.appendChild(link);
            hinweis.appendChild(document.createTextNode("."));
            head.appendChild(hinweis);
            var units = $("#DistanceUnits:checked").val();
            if (units != settings_distance_units) {
                setValue('settings_distance_units', units);
                settings_distance_units = units;
            }
        } catch(e) {gclh_error("Hide GC Avatar Option",e);}
    }

// Aufbau Links zum Aufruf von Config, Sync und Find Player. Und Changelog im Profile.
    try {
        // GClh Config, Sync und Find Player Aufrufe aus Linklist heraus.
        if (checkTaskAllowed("GClh Config", false) == true && document.getElementsByName("lnk_gclhconfig")[0]) {
            document.getElementsByName("lnk_gclhconfig")[0].href = "#GClhShowConfig";
            document.getElementsByName("lnk_gclhconfig")[0].addEventListener('click', gclh_showConfig, false);
        }
        if (checkTaskAllowed("GClh Sync", false) == true && document.getElementsByName("lnk_gclhsync")[0]) {
            document.getElementsByName("lnk_gclhsync")[0].href = "#GClhShowSync";
            document.getElementsByName("lnk_gclhsync")[0].addEventListener('click', gclh_showSync, false);
        }
        if (checkTaskAllowed("Find Player", false) == true && document.getElementsByName("lnk_findplayer")[0]) {
            document.getElementsByName("lnk_findplayer")[0].href = "#GClhShowFindPlayer";
            document.getElementsByName("lnk_findplayer")[0].addEventListener('click', createFindPlayerForm, false);
        }
        // GClh Config, Sync und Find Player Aufrufe mit Zusatz #GClhShowConfig bzw. #GClhShowSync bzw. #GClhShowFindPlayer.
        // 2. Schritt derzeit im Link bei Settings, Preferences Avatar, teils in den Links aus der Linklist, mit rechter Maustaste aus Links neben
        // Avatar auf Profile Seite und teils F4 bei Aufruf Config.
        if (document.location.href.match(/#GClhShowConfig/)) {
            document.location.href = clearUrlAppendix(document.location.href, true);
            setTimeout(gclh_showConfig, 5);
        }
        if (document.location.href.match(/#GClhShowSync/)) {
            document.location.href = clearUrlAppendix(document.location.href, true);
            setTimeout(gclh_showSync, 5);
        }
        if (document.location.href.match(/#GClhShowFindPlayer/)) {
            document.location.href = clearUrlAppendix(document.location.href, true);
            setTimeout(createFindPlayerForm, 5);
        }
        // Old Dashboard (Profile), Dashboard Seite.
        if ((is_page('profile') && $('#ctl00_ContentBody_WidgetMiniProfile1_memberProfileLink')[0]) || (is_page("dashboard") && $('.bio-meta'))) {
            // Config, Sync und Changelog Links beim Avatar in Profile, Dashboard.
            var lnk_config = "<a href='#GClhShowConfig' id='gclh_config_lnk' name='gclh_config_lnk' title='" + scriptShortNameConfig + " v" + scriptVersion + (settings_f4_call_gclh_config ? " / Key F4":"") + "' >" + scriptShortNameConfig + "</a>";
            var lnk_sync = " | <a href='#GClhShowSync' id='gclh_sync_lnk' name='gclh_sync_lnk' title='" + scriptShortNameSync + " v" + scriptVersion + (settings_f10_call_gclh_sync ? " / Key F10":"") + "' >" + scriptShortNameSync + "</a>";
            var lnk_changelog = " | <a href='"+urlChangelog+"' title='Documentation of changes and new features in GClh II on GitHub'>Changelog</a>";
            if (is_page('profile')) $('#ctl00_ContentBody_WidgetMiniProfile1_memberProfileLink')[0].parentNode.innerHTML += " | <br>" + lnk_config + lnk_sync + lnk_changelog;
            else $('.bio-meta')[0].innerHTML += lnk_config + lnk_sync + lnk_changelog;
            appendCssStyle(".bio-meta {font-size: 12px;} .bio-meta a:hover {color: #02874d;}");
            $('#gclh_config_lnk')[0].addEventListener('click', gclh_showConfig, false);
            $('#gclh_sync_lnk')[0].addEventListener('click', gclh_showSync, false);
            // Linklist Ablistung rechts im Profile.
            if (document.getElementsByName("lnk_gclhconfig_profile")[0]) {
                document.getElementsByName("lnk_gclhconfig_profile")[0].href = "#GClhShowConfig";
                document.getElementsByName("lnk_gclhconfig_profile")[0].addEventListener('click', gclh_showConfig, false);
            }
            if (document.getElementsByName("lnk_gclhsync_profile")[0]) {
                document.getElementsByName("lnk_gclhsync_profile")[0].href = "#GClhShowSync";
                document.getElementsByName("lnk_gclhsync_profile")[0].addEventListener('click', gclh_showSync, false);
            }
            if (document.getElementsByName("lnk_findplayer_profile")[0]) {
                document.getElementsByName("lnk_findplayer_profile")[0].href = "#GClhShowFindPlayer";
                document.getElementsByName("lnk_findplayer_profile")[0].addEventListener('click', createFindPlayerForm, false);
            }
        }
    } catch(e) {gclh_error("Aufbau Links zum Aufruf von Config, Sync und Find Player",e);}

// Special Links aus Linklist bzw. Default Links versorgen.
    try {
        setSpecialLinks();
    } catch(e) {gclh_error("Special Links",e);}
    function setSpecialLinks() {
        // Links zu Nearest Lists/Map in Linklist und Default Links setzen.
        if (getValue("home_lat", 0) != 0 && getValue("home_lng") != 0) {
            var link = "/seek/nearest.aspx?lat=" + (getValue("home_lat") / 10000000) + "&lng=" + (getValue("home_lng") / 10000000) + "&dist=25&disable_redirect=";
            setLnk("lnk_nearestlist", link);
            setLnk("lnk_nearestlist_profile", link);
            var link = map_url + "?lat=" + (getValue("home_lat") / 10000000) + "&lng=" + (getValue("home_lng") / 10000000);
            setLnk("lnk_nearestmap", link);
            setLnk("lnk_nearestmap_profile", link);
            var link = "/seek/nearest.aspx?lat=" + (getValue("home_lat") / 10000000) + "&lng=" + (getValue("home_lng") / 10000000) + "&dist=25&f=1&disable_redirect=";
            setLnk("lnk_nearestlist_wo", link);
            setLnk("lnk_nearestlist_wo_profile", link);
        }
        // Links zu den eigenen Trackables in Linklist und Default Links setzen.
        if (getValue("uid", "") != "") {
            var link = "/track/search.aspx?o=1&uid=" + getValue("uid");
            setLnk("lnk_my_trackables", link);
            setLnk("lnk_my_trackables_profile", link);
        }
    }
    function setLnk(lnk, link) {
        if (document.getElementsByName(lnk)[0]) document.getElementsByName(lnk)[0].href = link;
        if (document.getElementsByName(lnk)[1]) document.getElementsByName(lnk)[1].href = link;
    }

// Eingaben im Search Field verarbeiten.
    if (document.location.href.match(/\.com\/seek\/nearest\.aspx\?navi_search=/)) {
        try {
            var matches = document.location.href.match(/\?navi_search=(.*)/);
            if (matches && matches[1]) {
                $('#OriginText')[0].value = urldecode(matches[1]).replace(/%20/g, " ");
                function clickSearch() {$('#btnLocale')[0].click();}
                window.addEventListener("load", clickSearch, false);
            }
        } catch(e) {gclh_error("Eingaben im Search Field verarbeiten",e);}
    }

// Append '&visitcount=1' to all geochecker.com links.
    if (settings_visitCount_geocheckerCom && is_page("cache_listing")) {
        try {
            $('#ctl00_ContentBody_LongDescription a[href^="http://www.geochecker.com/index.php?code="]').filter(':not([href*="visitcount=1"])').attr('href', function(i, str) {
                return str + '&visitcount=1';
            }).attr('rel', 'noreferrer');
        } catch(e) {gclh_error("Append '&visitcount=1' to all geochecker.com links",e);}
    }

// Auto check checkbox on hide cache process.
    if (settings_hide_cache_approvals && document.location.href.match(/\.com\/hide\/(report|description|edit)\.aspx/)) {
        try {
            $("#ctl00_ContentBody_cbAgreement").prop('checked', true);
            $("#ctl00_ContentBody_chkUnderstand").prop('checked', true);
            $("#ctl00_ContentBody_chkDisclaimer").prop('checked', true);
            $("#ctl00_ContentBody_chkAgree").prop('checked', true);
        } catch(e) {gclh_error("Auto check checkbox on hide cache process",e);}
    }

// Improve Souvenirs
    if ( is_page("souvenirs") || is_page("publicProfile") ) {
        try {
            var SouvenirsDashboard = $(".ProfileSouvenirsList");
            if (SouvenirsDashboard.length) {
                SouvenirsDashboard.before('<div id="gclhSouvenirsSortButtons"></div><p></p>');
                $("#gclhSouvenirsSortButtons").append('<input id="actionSouvenirsSortAcquiredDateNewestTop" title="Sort newest first" value="Newest first" type="button" href="javascript:void(0);" style="opacity: 0.5; margin-right: 4px" disabled="true">');
                $("#gclhSouvenirsSortButtons").append('<input id="actionSouvenirsSortAcquiredDateOldestTop" title="Sort oldest first" value="Oldest first" type="button" href="javascript:void(0);" style="opacity: 0.5; margin-right: 4px" disabled="true">');
                $("#gclhSouvenirsSortButtons").append('<input id="actionSouvenirsSortAcquiredTitleAtoZ" title="Sort title A-Z" value="Title A-Z" type="button" href="javascript:void(0);" style="margin-right: 4px">');
                $("#gclhSouvenirsSortButtons").append('<input id="actionSouvenirsSortAcquiredTitleZtoA" title="Sort title Z-A" value="Title Z-A" type="button" href="javascript:void(0);">');

                var Souvenirs = SouvenirsDashboard.children('div');
                var htmlFragment = "&nbsp;<span title='Number of souvenirs'>("+Souvenirs.length+")</span>";
                $("#divContentMain > h2").append(htmlFragment); // private probfile
                $("#ctl00_ContentBody_ProfilePanel1_pnlSouvenirs > h3").append(htmlFragment); // new public profile

                var jqui_date_format = "";
                var accessTokenPromise = $.get('/account/settings/preferences');
                accessTokenPromise.done(function (response) {
                    response_div = document.createElement('div');
                    response_div.innerHTML = response;
                    date_format = $('select#SelectedDateFormat option:selected', response_div).val();
                    jqui_date_format = dateFormatConversion(date_format);
                    $('#actionSouvenirsSortAcquiredDateNewestTop')[0].disabled = $('#actionSouvenirsSortAcquiredDateOldestTop')[0].disabled = "";
                    $('#actionSouvenirsSortAcquiredDateNewestTop')[0].style.opacity = $('#actionSouvenirsSortAcquiredDateOldestTop')[0].style.opacity = "1";
                });
                function dateFormatConversion(format) {return format.replace(/yy/g,'y').replace(/M/g,'m').replace(/mmm/,'M');}
                function getSouvenirAcquiredDate(souvenirDiv) {return $(souvenirDiv).text().match( /Acquired on (.*)/ )[1];}
                function AcquiredDateNewestFirst(a, b) {
                    var ada = getSouvenirAcquiredDate(a);
                    var adb = getSouvenirAcquiredDate(b);
                    date1 = $.datepicker.parseDate(jqui_date_format, ada);
                    date2 = $.datepicker.parseDate(jqui_date_format, adb);
                    if(date1.getTime() == date2.getTime()) return TitleAtoZ(a, b);
                    return date1 < date2 ? 1 : -1;
                }
                function AcquiredDateOldestFirst(a, b) {
                    var ada = getSouvenirAcquiredDate(a);
                    var adb = getSouvenirAcquiredDate(b);
                    date1 = $.datepicker.parseDate(jqui_date_format, ada);
                    date2 = $.datepicker.parseDate(jqui_date_format, adb);
                    if(date1.getTime() == date2.getTime()) return TitleZtoA(a, b);
                    return date1 < date2 ? -1 : 1;
                }
                function TitleAtoZ(a, b) {
                    var aT = $(a).children('a').attr('title');
                    var bT = $(b).children('a').attr('title');
                    return aT.localeCompare(bT);
                }
                function TitleZtoA(a, b) {
                    var aT = $(a).children('a').attr('title');
                    var bT = $(b).children('a').attr('title');
                    return bT.localeCompare(aT);
                }
                function ReorderSouvenirs(orderfunction) {
                    SouvenirsDashboard = $(".ProfileSouvenirsList");
                    Souvenirs = SouvenirsDashboard.children('div');
                    Souvenirs.detach().sort(orderfunction);
                    SouvenirsDashboard.append(Souvenirs);
                }
                $("#actionSouvenirsSortAcquiredDateNewestTop").click(function() {ReorderSouvenirs(AcquiredDateNewestFirst);});
                $("#actionSouvenirsSortAcquiredDateOldestTop").click(function() {ReorderSouvenirs(AcquiredDateOldestFirst);});
                $("#actionSouvenirsSortAcquiredTitleAtoZ").click(function() {ReorderSouvenirs(TitleAtoZ);});
                $("#actionSouvenirsSortAcquiredTitleZtoA").click(function() {ReorderSouvenirs(TitleZtoA);});
            }
        } catch(e) {gclh_error("Improve Souvenirs",e);}
    }

// Check for upgrade.
    try {
        function checkForUpgrade(manual) {
            var next_check = parseInt(getValue("update_next_check"), 10);
            if (!next_check) next_check = 0;
            var time = new Date().getTime();

            if (next_check < time || manual == true) {
                time += 1 * 60 * 60 * 1000;  // 1 Stunde warten, bis zum nächsten Check.
                setValue('update_next_check', time.toString());
                if (GM_xmlhttpRequest) {
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: urlScript,
                        onload: function(result) {
                            try {
                                var version = result.responseText.match(/\/\/\s\@version(.*)/);
                                if (version) {
                                    var new_version = version[1].replace(/\s/g, "");
                                    if (new_version != scriptVersion) {
                                        var currVersion = "version " + scriptVersion;
                                        var text = "Version " + new_version + " of script \""+ scriptName + "\" is available.\n" +
                                                   "You are currently using " + currVersion + ".\n\n" +
                                                   "Click OK to upgrade.\n\n" +
                                                   "(After upgrade, please refresh your page.)";
                                        if (window.confirm(text)) {
                                            btnClose();
                                            document.location.href = urlScript;
                                        } else {
                                            time += 7 * 60 * 60 * 1000;  // 1+7 Stunden warten, bis zum nächsten Check.
                                            setValue('update_next_check', time.toString());
                                        }
                                    } else if (manual == true) {
                                        var text = "Version " + scriptVersion + " of script \""+ scriptName + "\" \n" +
                                                   "is the latest and actual version.\n";
                                        alert(text);
                                    }
                                }
                            } catch(e) {gclh_error("Check for upgrade, onload",e);}
                        }
                    });
                }
            }
        }
        checkForUpgrade(false);
    } catch(e) {gclh_error("Check for upgrade",e);}

// Special days.
    if (is_page("cache_listing")) {
        try {
            var now = new Date();
            var year = now.getYear() + 1900;
            var month = now.getMonth() + 1;
            var date = now.getDate();
            // Ostern 2020.
            if ((date >= 10 && date <= 13 && month == 4 && year == 2020)) {
                $(".CacheDetailNavigation:first > ul:first").append('<li><img src="'+urlImages+'easter_bunny_001.jpg" style="margin-bottom: -35px;" title="Happy Easter"></li>');
            }
            // Weihnachten 2019.
            if (month == 12 && year == 2019) {
                var max = 0;
                if      (date == 1) max = 64;
                else if (date == 5 || date == 6) max = 64;
                else if (date == 7 || date == 8) max = 64;
                else if (date == 14 || date == 15) max = 64;
                else if (date >= 22 && date <= 26) max = 48;
                if (max > 0) {
                    function checkChristmasData(waitCount) {
                        if ($('#gclh_vip_list span').length > 0 && $('#gclh_vip_list .StatusIcon').length == 0) {
                            setTimeout(function() {
                                var icons = $('#gclh_latest_logs,#gclh_vip_list').find('img[src*="/images/logtypes/2.png"]');
                                for (var i = 0; i < icons.length; i += 2) {
                                    var num = random(max, 1);
                                    if (num > 0 && num < 9) icons[i].src = urlImages+"nicolaus_head_0" + num + ".png";
                                }
                            }, 500);
                        } else {waitCount++; if (waitCount <= 40) setTimeout(function(){checkChristmasData(waitCount);}, 500);}
                    }
                    checkChristmasData(0);
                }
            }
        } catch(e) {gclh_error("Special days",e);}
    }

//////////////////////////////
// GClh Functions
//////////////////////////////
    function in_array(search, arr) {
        for (var i = 0; i < arr.length; i++) {if (arr[i] == search) return true;}
        return false;
    }

    function caseInsensitiveSort(a, b) {
        var ret = 0;
        a = a.toLowerCase();
        b = b.toLowerCase();
        if (a > b) ret = 1;
        if (a < b) ret = -1;
        return ret;
    }

// decodeURIComponent for non-standard unicode encoding (issue-818)
    function decodeUnicodeURIComponent(s) {
        function unicodeToChar(text) {
            return text.replace(/%u[\dA-F]{4}/gi,
                function (match) {
                    return String.fromCharCode(parseInt(match.replace(/%u/g, ''), 16));
                });
        }
        return decodeURIComponent(unicodeToChar(s));
    }

// Enkodieren in url und dekodieren aus url.
    function urlencode(s) {
        s = s.replace(/&amp;/g, "&");
        s = encodeURIComponent(s);  // Alles außer: A bis Z, a bis z und - _ . ! ~ * ' ( )
        s = s.replace(/~/g, "%7e");
        s = s.replace(/'/g, "%27");
        s = s.replace(/%26amp%3b/g, "%26");
        s = s.replace(/%26nbsp%3B/g, "%20");
        s = s.replace(/ /g, "+");
        return s;
    }

    function urldecode(s) {
        s = s.replace(/\+/g, " ");
        s = s.replace(/%252b/ig, "+");
        s = s.replace(/%7e/g, "~");
        s = s.replace(/%27/g, "'");
        s = decodeUnicodeURIComponent(s);
        return s;
    }

// HTML dekodieren, zB: "&amp;" in "&" (zB: User "Rajko & Dominik".)
    function decode_innerHTML(v_mit_innerHTML) {
        var elem = document.createElement('textarea');
        elem.innerHTML = v_mit_innerHTML.innerHTML;
        v_decode = elem.value;
        v_new = v_decode.trim();
        return v_new;
    }
    function html_to_str(s) {
        s = s.replace(/\&amp;/g, "&");
        s = s.replace(/\&nbsp;/g, " ");
        return s;
    }

    function trim(s) {
        var whitespace = ' \n ';
        for (var i = 0; i < whitespace.length; i++) {
            while (s.substring(0, 1) == whitespace.charAt(i)) {
                s = s.substring(1, s.length);
            }
            while (s.substring(s.length - 1, s.length) == whitespace.charAt(i)) {
                s = s.substring(0, s.length - 1);
            }
        }
        if (s.substring(s.length - 6, s.length) == "&nbsp;") s = s.substring(0, s.length - 6);
        return s;
    }

// Change coordinates from N/S/E/W Deg Min.Sec to Dec.
    function toDec(coords) {
        var match = coords.match(/([0-9]+)°([0-9]+)\.([0-9]+)′(N|S), ([0-9]+)°([0-9]+)\.([0-9]+)′(W|E)/);
        if (match) {
            var dec1 = parseInt(match[1], 10) + (parseFloat(match[2] + "." + match[3]) / 60);
            if (match[4] == "S") dec1 = dec1 * -1;
            dec1 = Math.round(dec1 * 10000000) / 10000000;
            var dec2 = parseInt(match[5], 10) + (parseFloat(match[6] + "." + match[7]) / 60);
            if (match[8] == "W") dec2 = dec2 * -1;
            dec2 = Math.round(dec2 * 10000000) / 10000000;
            return new Array(dec1, dec2);
        } else {
            match = coords.match(/(N|S) ([0-9]+)°? ([0-9]+)\.([0-9]+)′?'? (E|W) ([0-9]+)°? ([0-9]+)\.([0-9]+)/);
            if (match) {
                var dec1 = parseInt(match[2], 10) + (parseFloat(match[3] + "." + match[4]) / 60);
                if (match[1] == "S") dec1 = dec1 * -1;
                dec1 = Math.round(dec1 * 10000000) / 10000000;
                var dec2 = parseInt(match[6], 10) + (parseFloat(match[7] + "." + match[8]) / 60);
                if (match[5] == "W") dec2 = dec2 * -1;
                dec2 = Math.round(dec2 * 10000000) / 10000000;
                return new Array(dec1, dec2);
            } else {
                match = coords.match(/(N|S) ([0-9]+) ([0-9]+) ([0-9]+)\.([0-9]+) (E|W) ([0-9]+) ([0-9]+) ([0-9]+)\.([0-9]+)/);
                if (match) {
                    var dec1 = parseInt(match[2], 10) + (parseFloat(match[3]) / 60) + (parseFloat(match[4] + "." + match[5]) / 3600);
                    if (match[1] == "S") dec1 = dec1 * -1;
                    dec1 = Math.round(dec1 * 10000000) / 10000000;
                    var dec2 = parseInt(match[7], 10) + (parseFloat(match[8]) / 60) + (parseFloat(match[9] + "." + match[10]) / 3600);
                    if (match[6] == "W") dec2 = dec2 * -1;
                    dec2 = Math.round(dec2 * 10000000) / 10000000;
                    return new Array(dec1, dec2);
                } else {
                    match = coords.match(/(N|S) ([0-9]+) ([0-9]+) ([0-9]+\..[0-9].) (E|W) ([0-9]+) ([0-9]+) ([0-9]+\..[0-9].)/);
                    if (match) {
                        var dec1 = parseInt(match[2], 10) + (parseFloat(match[3]) / 60) + (parseFloat(match[4]) / 3600);
                        if (match[1] == "S") dec1 = dec1 * -1;
                        dec1 = Math.round(dec1 * 10000000) / 10000000;
                        var dec2 = parseInt(match[6], 10) + (parseFloat(match[7]) / 60) + (parseFloat(match[8]) / 3600);
                        if (match[5] == "W") dec2 = dec2 * -1;
                        dec2 = Math.round(dec2 * 10000000) / 10000000;
                        return new Array(dec1, dec2);
                    } else return false;
                }
            }
        }
    }
// Change coordinates from Deg to DMS.
    function DegtoDMS(coords) {
        var match = coords.match(/^(N|S) ([0-9][0-9]). ([0-9][0-9])\.([0-9][0-9][0-9]) (E|W) ([0-9][0-9][0-9]). ([0-9][0-9])\.([0-9][0-9][0-9])$/);
        if (!match) return "";
        var lat1 = parseInt(match[2], 10);
        var lat2 = parseInt(match[3], 10);
        var lat3 = parseFloat("0." + match[4]) * 60;
        lat3 = Math.round(lat3 * 10000) / 10000;
        var lng1 = parseInt(match[6], 10);
        var lng2 = parseInt(match[7], 10);
        var lng3 = parseFloat("0." + match[8]) * 60;
        lng3 = Math.round(lng3 * 10000) / 10000;
        return match[1] + " " + lat1 + "° " + lat2 + "' " + lat3 + "\" " + match[5] + " " + lng1 + "° " + lng2 + "' " + lng3 + "\"";
    }
// Change coordinates from Dec to Deg.
    function DectoDeg(lat, lng) {
        var n = "000";
        lat = lat / 10000000;
        var pre = "";
        if (lat > 0) pre = "N";
        else {
            pre = "S";
            lat = lat * -1;
        }
        var tmp1 = parseInt(lat);
        var tmp2 = (lat - tmp1) * 60;
        tmp1 = String(tmp1);
        if (tmp1.length == 1) tmp1 = "0" + tmp1;
        tmp2 = Math.round(tmp2 * 10000) / 10000;
        tmp2 = String(tmp2);
        if (tmp2.length == 0) tmp2 = tmp2 + "0.000";
        else if (tmp2.indexOf(".") == -1) tmp2 = tmp2 + ".000";
        else if (tmp2.indexOf(".") != -1) tmp2 = tmp2 + n.slice(tmp2.length - tmp2.indexOf(".") - 1);
        var new_lat = pre + " " + tmp1 + "° " + tmp2;
        lng = lng / 10000000;
        var pre = "";
        if (lng > 0) pre = "E";
        else {
            pre = "W";
            lng = lng * -1;
        }
        var tmp1 = parseInt(lng);
        var tmp2 = (lng - tmp1) * 60;
        tmp1 = String(tmp1);
        if (tmp1.length == 2) tmp1 = "0" + tmp1;
        else if (tmp1.length == 1) tmp1 = "00" + tmp1;
        tmp2 = Math.round(tmp2 * 10000) / 10000;
        tmp2 = String(tmp2);
        if (tmp2.length == 0) tmp2 = tmp2 + "0.000";
        else if (tmp2.indexOf(".") == -1) tmp2 = tmp2 + ".000";
        else if (tmp2.indexOf(".") != -1) tmp2 = tmp2 + n.slice(tmp2.length - tmp2.indexOf(".") - 1);
        var new_lng = pre + " " + tmp1 + "° " + tmp2;
        return new_lat + " " + new_lng;
    }

// Close Overlays, Find Player, Config, Sync.
    function btnClose(clearUrl) {
        if (global_mod_reset) {
            rcClose();
            return;
        }
        if ($('#bg_shadow')[0]) $('#bg_shadow')[0].style.display = "none";
        if ($('#settings_overlay')[0]) $('#settings_overlay')[0].style.display = "none";
        if ($('#sync_settings_overlay')[0]) $('#sync_settings_overlay')[0].style.display = "none";
        if ($('#findplayer_overlay')[0]) $('#findplayer_overlay')[0].style.display = "none";
        if (clearUrl != false) document.location.href = clearUrlAppendix(document.location.href, false);
    }

// Get Finds out of login text box.
    function get_my_finds() {
        var finds = "";
        if ($('.cache-count').text()) finds = parseInt($('.cache-count').text().replace(/\s/g,'').match(/[0-9,\.]+/)[0].replace(/[,\.]/,""));
        return finds;
    }

// Sucht Original Usernamen des Owners aus Listing.
    function get_real_owner() {
        if ($('#ctl00_ContentBody_bottomSection')) {
            var links = $('#ctl00_ContentBody_bottomSection a[href*="/seek/nearest.aspx?u="]');
            for (var i = 0; i < links.length; i++) {
                var match = links[i].href.match(/\/seek\/nearest\.aspx\?u\=(.*)$/);
                if (match) return urldecode(match[1]);
            }
            return false;
        } else return false;
    }

// Hide header in map.
    function hide_map_header() {
        if ($('nav')[0].style.display != "none") {
            $('nav')[0].style.display = "none";
            $('#Content')[0].style.top = 0;
        } else {
            $('nav')[0].style.display = "block";
            $('#Content')[0].style.top = "80px";
        }
    }

// Zu lange Zeilen "kürzen", damit nicht umgebrochen wird.
    function noBreakInLine(n_side, n_maxwidth, n_title) {
        if (n_side == "" || n_side == undefined || n_maxwidth == 0) return;
        n_side.setAttribute("style", "max-width: " + n_maxwidth + "px; display: inline-block; overflow: hidden; vertical-align: bottom; white-space: nowrap; text-overflow: ellipsis;");
        if (n_title != "") n_side.setAttribute("title", n_title);
    }

// Mail Icons, Message Icons.
    // Cache, TB, Aktiv User Infos ermitteln.
    function getGcTbUserInfo() {
        var g_gc = false; var g_tb = false;
        var g_code = ""; var g_name = ""; var g_link = ""; var g_founds = ""; var g_date = ""; var g_time = ""; var g_dateTime = ""; var g_activ_username = "";
        if ((settings_show_mail || settings_show_message)) {
            // Cache Listing.
            if ($('#ctl00_ContentBody_CacheName')[0]) {
                g_gc = true;
                g_name = $('#ctl00_ContentBody_CacheName')[0].innerHTML;
                if ($('#ctl00_ContentBody_CoordInfoLinkControl1_uxCoordInfoCode')[0]) g_code = $('#ctl00_ContentBody_CoordInfoLinkControl1_uxCoordInfoCode')[0].innerHTML;
            // TB Listing.
            } else if ($('#ctl00_ContentBody_CoordInfoLinkControl1_uxCoordInfoCode')[0]) {
                g_tb = true;
                g_code = $('#ctl00_ContentBody_CoordInfoLinkControl1_uxCoordInfoCode')[0].innerHTML;
                if ($('#ctl00_ContentBody_lbHeading')[0]) g_name = $('#ctl00_ContentBody_lbHeading')[0].innerHTML;
            // Log view.
            } else if ($('#ctl00_ContentBody_LogBookPanel1_lbLogText')[0]) {
                // Cache.
                if ($('#ctl00_ContentBody_LogBookPanel1_lbLogText')[0].childNodes[4] &&
                     $('#ctl00_ContentBody_LogBookPanel1_lbLogText')[0].childNodes[4].href.match(/\/cache_details\.aspx\?guid=/)) {
                    g_gc = true;
                    g_name = $('#ctl00_ContentBody_LogBookPanel1_lbLogText')[0].childNodes[4].innerHTML;
                }
                // TB.
                if ($('#ctl00_ContentBody_LogBookPanel1_lbLogText')[0].childNodes[4] &&
                     $('#ctl00_ContentBody_LogBookPanel1_lbLogText')[0].childNodes[4].href.match(/\/track\/details\.aspx\?guid=/)) {
                    g_tb = true;
                    g_name = $('#ctl00_ContentBody_LogBookPanel1_lbLogText')[0].childNodes[4].innerHTML;
                }
            // Log post.
            } else if ($('#ctl00_ContentBody_LogBookPanel1_WaypointLink')[0]) {
                // Cache old log page.
                if ($('#ctl00_ContentBody_LogBookPanel1_WaypointLink')[0].parentNode.children[2] &&
                     $('#ctl00_ContentBody_LogBookPanel1_WaypointLink')[0].parentNode.children[2].href.match(/\/cache_details\.aspx\?guid=/)) {
                    g_gc = true;
                    g_name = $('#ctl00_ContentBody_LogBookPanel1_WaypointLink')[0].parentNode.children[2].innerHTML;
                }
                // TB.
                if ($('#ctl00_ContentBody_LogBookPanel1_WaypointLink')[0].parentNode.children[2] &&
                     $('#ctl00_ContentBody_LogBookPanel1_WaypointLink')[0].parentNode.children[2].href.match(/\/track\/details\.aspx\?guid=/)) {
                    g_tb = true;
                    g_name = $('#ctl00_ContentBody_LogBookPanel1_WaypointLink')[0].parentNode.children[2].innerHTML;
                }
            // Log post cache new log page.
            } else if ($('.muted')[0] && $('.muted')[0].children[0].innerHTML) {
                g_gc = true;
                g_name = $('.muted')[0].children[0].innerHTML;
            }
            if (g_code != "") {
                g_link = "(http://coord.info/" + g_code + ")";
                g_code = "(" + g_code + ")";
            }
            g_founds = get_my_finds();
            [g_date, g_time, g_dateTime] = getDateTime();
            g_activ_username = global_me;
        }
        return [g_gc, g_tb, g_code, g_name, g_link, g_activ_username, g_founds, g_date, g_time, g_dateTime];
    }
    // Message Icon, Mail Icon aufbauen.
    function buildSendIcons(b_side, b_username, b_art, guidSpecial) {
        if (b_art == "per guid") {
            // guid aus besonderen Proceduren (zB: post cache log new page).
            if (guidSpecial) guid = guidSpecial;
            if (guid == "" || guid == undefined) return;
            if (guid.match(/\#/)) return;
            // Keine Verarbeitung für Stat Bar.
            if (b_side.innerHTML.match(/https?:\/\/img\.geocaching\.com\/stats\/img\.aspx/)) return;
        } else {
            if (b_username == "") return;
        }
        if (b_side == "" || b_side == undefined || b_username == undefined || global_activ_username == "" || global_activ_username == undefined || b_username == global_activ_username) return;
        // Wenn Owner, dann echten Owner setzen und nicht gegebenenfalls abweichenden Owner aus Listing "A cache by".
        if (b_side.parentNode.id == "ctl00_ContentBody_mcd1") {
            var owner = get_real_owner();
            b_username = owner;
        }
        // Wenn User "In the hands of ..." im TB Listing, prüfen ob aktiver Username dort enthalten ist und Mail, Message nicht erzeugen.
        var username_send = b_username;
        if (b_side.id == "ctl00_ContentBody_BugDetails_BugLocation") {
            if (b_username.match(global_activ_username)) return;
            b_username = "";
            username_send = "user";
        }
        // Message, Mail Template aufbauen.
        template_message = urlencode(buildSendTemplate());
        template = urlencode(buildSendTemplate().replace(/#Receiver#/ig, b_username));
        // Message Icon erzeugen.
        if (settings_show_message && b_art == "per guid") {
            var mess_link = document.createElement("a");
            var mess_img = document.createElement("img");
            mess_img.setAttribute("style", "margin-left: 0px; margin-right: 0px");
            mess_img.setAttribute("title", "Send a message to " + username_send);
            mess_img.setAttribute("src", global_message_icon);
            mess_link.appendChild(mess_img);
            if (settings_message_icon_new_win) mess_link.setAttribute("target", "_blank");
            mess_link.setAttribute("href", "/account/messagecenter?recipientId=" + guid + "&text=" + template_message);
            b_side.parentNode.insertBefore(mess_link, b_side.nextSibling);
            b_side.parentNode.insertBefore(document.createTextNode(" "), b_side.nextSibling);
            // "Message this owner" und Icon entfernen.
            $('#ctl00_ContentBody_mcd1').find(".message__owner").remove();  // Cache Listing
            $('.BugDetailsList').find(".message__owner").remove();  // TB Listing
        }
        // Mail Icon erzeugen.
        if (settings_show_mail) {
            var mail_link = document.createElement("a");
            var mail_img = document.createElement("img");
            mail_img.setAttribute("style", "margin-left: 0px; margin-right: 0px");
            mail_img.setAttribute("title", "Send a mail to " + username_send);
            mail_img.setAttribute("src", global_mail_icon);
            mail_link.appendChild(mail_img);
            if (settings_mail_icon_new_win) mail_link.setAttribute("target", "_blank");
            if (b_art == "per guid") {
                mail_link.setAttribute("href", "/email/?guid=" + guid + "&text=" + template);
                b_side.parentNode.insertBefore(mail_link, b_side.nextSibling);
                b_side.parentNode.insertBefore(document.createTextNode(" "), b_side.nextSibling);
            } else {
                b_side.appendChild(document.createTextNode(" "));
                mail_link.setAttribute("href", "/email/?u=" + urlencode(b_username) + "&text=" + template);
                b_side.appendChild(mail_link);
                b_side.appendChild(document.createTextNode(" "));
            }
        }
    }
    // Message, Mail Template aufbauen, bis auf Empfänger.
    function buildSendTemplate() {
        var tpl = getValue("settings_mail_signature", "");
        var trimIt = (tpl.length == tpl.trim().length);
        tpl = tpl.replace(/#Found#/ig, global_founds+1).replace(/#Found_no#/ig, global_founds).replace(/#Me#/ig, global_activ_username);
        tpl = tpl.replace(/#Date#/ig, global_date).replace(/#Time#/ig, global_time).replace(/#DateTime#/ig, global_dateTime);
        tpl = tpl.replace(/#GCTBName#/ig, global_name).replace(/#GCTBCode#/ig, global_code).replace(/#GCTBLink#/ig, global_link);
        if (trimIt) tpl = tpl.trim();
        return tpl;
    }

// Zebra Look einfärben bzw. Einfärbung entfernen.
    function setLinesColorInZebra(para, lines, linesTogether) {
        if (lines.length == 0) return;
        var replaceSpec = /(AlternatingRow)(\s*)/g;
        var setSpec = "AlternatingRow";

        // Wenn Einfärbung nicht stattfinden soll.
        if (para == false) setLinesColorNone(lines, replaceSpec);
        // Wenn Einfärbung stattfinden soll.
        else {
            if (is_page('lists')) {
                var hell = true;
                for (var i = 0; i < lines.length; i++) {
                    if (hell == true) {
                        hell = false;
                        if ($(lines[i]).hasClass(setSpec)) $(lines[i]).removeClass(setSpec);
                        if ($(lines[i]).hasClass('has-description') && lines[i+1]) {
                            if ($(lines[i+1]).hasClass(setSpec)) $(lines[i+1]).removeClass(setSpec);
                            i++;
                        }
                    } else {
                        hell = true;
                        if (!$(lines[i]).hasClass(setSpec)) $(lines[i]).addClass(setSpec);
                        if ($(lines[i]).hasClass('has-description') && lines[i+1]) {
                            if (!$(lines[i+1]).hasClass(setSpec)) $(lines[i+1]).addClass(setSpec);
                            i++;
                        }
                    }
                }
            } else {
                // Zeilen im ersten Zeilenbereich gegebenenfalls auf hell zurücksetzen.
                for (var i = 0; i < lines.length; i += (2 * linesTogether)) {
                    for (var j = 0; j < linesTogether; j++) {
                        if (lines[i+j].className.match(replaceSpec)) {
                            var newClass = lines[i+j].className.replace(replaceSpec, "");
                            lines[i+j].setAttribute("class", newClass);
                        }
                    }
                }
                // Zeilen im zweiten Zeilenbereich gegebenenfalls an erster Stelle auf dunkel setzen.
                for (var i = linesTogether; i < lines.length; i += (2 * linesTogether)) {
                    for (var j = 0; j < linesTogether; j++) {
                        if (lines[i+j].className.match(replaceSpec));
                        else {
                            if (lines[i+j].getAttribute("class") == (undefined|null|"")) var oldClass = "";
                            else var oldClass = " " + lines[i+j].getAttribute("class");
                            lines[i+j].setAttribute("class", setSpec + oldClass);
                        }
                    }
                }
            }
        }
    }

// User, Owner, Reviewer, VIPs einfärben bzw. Einfärbung entfernen.
    function setLinesColorUser(paraStamm, tasks, lines, linesTogether, owner, bookmarklist) {
        if (lines.length == 0) return;
        var user = global_me;
        if (owner == undefined) var owner = "";
        var vips = getValue("vips");
        if (vips != false) {
            vips = vips.replace(/, (?=,)/g, ",null");
            vips = JSON.parse(vips);
        }
        var setSpecUser = "TertiaryRow";
        var setSpecOwner = "QuaternaryRow";
        var setSpecReviewer = "QuinaryRow";
        var setSpecVip = "SenaryRow";
        var replaceSpecUser = /(TertiaryRow)(\s*)/g;
        var replaceSpecVip = /(SenaryRow)(\s*)/g;
        var para = new Array();
        if (tasks.match("user")) para["user"] = getValue(paraStamm + "_user");
        else para["user"] = "";
        if (tasks.match("owner")) para["owner"] = getValue(paraStamm + "_owner");
        else para["owner"] = "";
        if (tasks.match("reviewer")) para["reviewer"] = getValue(paraStamm + "_reviewer");
        else para["reviewer"] = "";
        if (tasks.match("vip")) para["vip"] = getValue(paraStamm + "_vip");
        else para["vip"] = "";

        // Wenn Einfärbung für User nicht stattfinden soll, entfernen.
        if (para["user"] == false) setLinesColorNone(lines, replaceSpecUser);
        // Wenn Einfärbung stattfinden soll.
        if (para["user"] == true || para["owner"] == true || para["reviewer"] == true || para["vip"] == true) {
            for (var i = 0; i < lines.length; i += linesTogether) {
                var newClass = "";
                var aTags = lines[i].getElementsByTagName("a");
                var imgTags = lines[i].getElementsByTagName("img");
                if (bookmarklist == 'new') var useTags = lines[i].getElementsByTagName("use");
                // Cache, TB Listing. Anhand guid prüfen, ob Einfärbung für User oder Owner notwendig ist.
                if (para["user"] || para["owner"]) {
                    for (var j = 0; j < aTags.length; j++) {
                        if (aTags[j].href.match(/\/profile\/\?guid=/)) {
                            if (decode_innerHTML(aTags[j]) == user && para["user"]) newClass = setSpecUser;
                            else if (decode_innerHTML(aTags[j]) == owner && para["owner"]) newClass = setSpecOwner;
                            break;
                        }
                    }
                    // Bookmark Listen ALT. Anhand Found Icon prüfen, ob Einfärbung für User notwendig ist.
                    // (Originallogs würden wegen src mit found noch hier reingehen -> para bookmarklist.)
                    if (newClass == "" && para["user"] && bookmarklist == true) {
                        for (var j = 0; j < imgTags.length; j++) {
                            if (imgTags[j].src.match(/\/found\./)) {
                                newClass = setSpecUser;
                                break;
                            }
                        }
                    }
                    // Bookmark Listen NEU. Anhand xlink:href="#smiley" prüfen, ob Einfärbung für User notwendig ist.
                    if (newClass == "" && para["user"] && bookmarklist == 'new' && useTags.length > 0) {
                        for (var j = 0; j < useTags.length; j++) {
                            if (useTags[j].getAttribute('xlink:href').match(/#smiley/)) {
                                newClass = setSpecUser;
                                break;
                            }
                        }
                    }
                }
                // Cache, TB Listing. Anhand Admin Icon prüfen, ob Einfärbung für Reviewer notwendig ist.
                // (Logs von ehemaligen Reviewern werden nicht mehr eingefärbt. Besser wäre wohl Icons abzufragen.)
                if (newClass == "" && para["reviewer"]) {
                    for (var j = 0; j < imgTags.length; j++) {
                        if (imgTags[j].src.match(/\/icon_admin\./)) {
                            newClass = setSpecReviewer;
                            break;
                        }
                    }
                }
                // Cache, TB Listing. Anhand titles zum VIP Icon und guid der VIP prüfen, ob Einfärbung für VIP notwendig ist. VIP kann sich während Seitendarstellung ändern.
                if (newClass == "" && para["vip"] && vips) {
                    // Farbe für VIP zurücksetzen.
                    for (var j = 0; j < linesTogether; j++) {
                        if (lines[i+j].className.match(replaceSpecVip)) {
                            var replaceClass = lines[i+j].className.replace(replaceSpecVip, "");
                            lines[i+j].setAttribute("class", replaceClass);
                        }
                    }
                    // Wenn VIP Icon gesetzt und guid in VIPS Area vorhanden, merken, dass Farbe für VIP gesetzt werden muss.
                    for (var j = 0; j < imgTags.length; j++) {
                        if (imgTags[j].title.match(/from VIP-List/)) {
                            for (var k = 0; k < aTags.length; k++) {
                                if (aTags[k].href.match(/\/profile\/\?guid=/)) {
                                    if (in_array(decode_innerHTML(aTags[k]), vips)) {
                                        newClass = setSpecVip;
                                    }
                                    break;
                                }
                            }
                            break;
                        }
                    }
                }

                // Wenn Einfärbung notwendig ist. Prüfen, ob Einfärbung nicht vorhanden ist, gegebenenfalls dann an erster Stelle einbauen.
                if (newClass != "") {
                    for (var j = 0; j < linesTogether; j++) {
                        if (lines[i+j].className.match(newClass));
                        else {
                            if (lines[i+j].getAttribute("class") == null) var oldClass = "";
                            else var oldClass = " " + lines[i+j].getAttribute("class");
                            lines[i+j].setAttribute("class", newClass + oldClass);
                            if (bookmarklist == 'new' && $(lines[i+j]).hasClass('has-description') && lines[i+j+1]) {
                                lines[i+j+1].setAttribute("class", newClass + oldClass);
                            }
                        }
                    }
                }
            }
        }
    }

// Spezifikation für Einfärbung Zeile entfernen.
    function setLinesColorNone(lines, replSpez) {
        if (lines.length == 0) return;
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].className.match(replSpez)) {
                var newClass = lines[i].className.replace(replSpez, "");
                lines[i].setAttribute("class", newClass);
            }
        }
    }

// Neue Parameter im GClh Config hervorheben und Versions Info setzen.
    var d = "<div  style='background-color: rgba(240, 223, 198, #); width: 100%; height: 100%; padding: 2px 0px 2px 2px; margin-left: -2px;'>";
    var s = "<span style='background-color: rgba(240, 223, 198, #); float: right; padding-top: 25px; width: 100%; margin: -22px 2px 0px 0px;'></span>";
//--> $$001
    newParameterOn1 = d.replace("#", "1.0");
    newParameterOn2 = d.replace("#", "0.3");
    newParameterOn3 = d.replace("#", "0.6");
    newParameterLL1 = s.replace("#", "1.0");
    newParameterLL2 = s.replace("#", "0.3");
    newParameterLL3 = s.replace("#", "0.6");
//<-- $$001
    function newParameterVersionSetzen(version) {
        var newParameterVers = "<span style='font-size: 70%; font-style: italic; float: right; margin-top: -14px; margin-right: 4px;' ";
        if (version != "") newParameterVers += "title='Implemented with version " + version + "'>" + version + "</span>";
        else newParameterVers += "></span>";
        if (settings_hide_colored_versions) newParameterVers = "";
        return newParameterVers;
    }
    newParameterOff = "</div>";
    function newParameterLLVersionSetzen(version) {
        var newParameterVers = '<span style="font-size: 70%; font-style: italic; margin-top: 10px; margin-left: -180px; position: absolute; cursor: default;"';
        if (version != "") newParameterVers += 'title="Implemented with version ' + version + '">' + version + '</span>';
        else newParameterVers += '></span>';
        if (settings_hide_colored_versions) newParameterVers = "";
        return newParameterVers;
    }
    if (settings_hide_colored_versions) newParameterOn1 = newParameterOn2 = newParameterOn3 = newParameterLL1 = newParameterLL2 = newParameterLL3 = newParameterOff = "";

// Seite abdunkeln.
    function buildBgShadow() {
        var shadow = document.createElement("div");
        shadow.setAttribute("id", "bg_shadow");
        shadow.setAttribute("style", "z-index:1000; width: 100%; height: 100%; background-color: #000000; position:fixed; top: 0; left: 0; opacity: 0.5; filter: alpha(opacity=50);");
        $('body')[0].appendChild(shadow);
        $('#bg_shadow')[0].addEventListener("click", btnClose, false);
    }

// Ist Config aktiv?
    function check_config_page() {
        var config_page = false;
        if ($('#bg_shadow')[0] && $('#bg_shadow')[0].style.display == "" && $('#settings_overlay')[0] && $('#settings_overlay')[0].style.display == "") config_page = true;
        return config_page;
    }
// Ist Sync aktiv?
    function check_sync_page() {
        var sync_page = false;
        if ($('#bg_shadow')[0] && $('#bg_shadow')[0].style.display == "" && $('#sync_settings_overlay')[0] && $('#sync_settings_overlay')[0].style.display == "") sync_page = true;
        return sync_page;
    }

// Ist spezielle Verarbeitung auf aktueller Seite erlaubt?
    function checkTaskAllowed(task, doAlert) {
        if ((document.location.href.match(/^https?:\/\/(www\.wherigo|www\.waymarking|labs\.geocaching)\.com/) || isMemberInPmoCache()) ||
            (task != "Find Player" &&  document.location.href.match(/(\.com\/map\/|\.com\/play\/map\/)/))) {
            if (doAlert != false) alert("This GC little helper functionality is not available at this page.\n\nPlease go to the \"Dashboard\" page, there is anyway all of these \nfunctionality available. ( www.geocaching.com/my )");
            return false;
        }
        return true;
    }

// Zusatz in url, eingeleitet durch "#", zurücksetzen bis auf "#".
    function clearUrlAppendix(url, onlyTheFirst) {
        var urlSplit = url.split('#');
        var newUrl = "";
        if (onlyTheFirst) newUrl = url.replace(urlSplit[1], "").replace("##", "#");
        else newUrl = urlSplit[0] + "#";
        return newUrl;
    }

// Ist Basic Member in PMO Cache?
    function isMemberInPmoCache() {
        if (is_page("cache_listing") && $('#premium-upgrade-widget')[0]) return true;
        else return false;
    }

// Installationszähler simulieren.
    function instCount(declaredVersion) {
        var side = $('body')[0];
        var div = document.createElement("div");
        div.id = "gclh_simu";
        div.setAttribute("style", "margin-top: -50px;");
        var prop = ' style="border: none; visibility: hidden; width: 2px; height: 2px;" alt="">';
//--> $$002
        var code = '<img src="https://c.andyhoppe.com/1573469947"' + prop +
                   '<img src="https://c.andyhoppe.com/1573469999"' + prop +
                   '<img src="https://www.worldflagcounter.com/gF0"' + prop +
                   '<img src="https://s11.flagcounter.com/count2/gypL/bg_FFFFFF/txt_000000/border_CCCCCC/columns_6/maxflags_60/viewers_0/labels_1/pageviews_1/flags_0/percent_0/"' + prop;
//<-- $$002
        div.innerHTML = code;
        side.appendChild(div);
        setValue("declared_version", scriptVersion);
        setTimeout(function() {$("#gclh_simu").remove();}, 4000);
        setTimeout(function() {
            var url = urlChangelog;
            var text = "Version " + scriptVersion + " of  \"" + scriptName + "\"  was successfully installed.\n\n"
                     + "Do you want to open the changelog in a new tab, to have a quick\n"
                     + "look at changes and new features?\n";
            if (window.confirm(text)) window.open(url, '_blank');
        }, 1000);
    }

// Migrationsaufgaben erledigen für neue Version.
    function migrationTasks() {
        // Migrate Mail signature to Mail template (zu v0.4).
        if (getValue("migration_task_01", false) != true) {
            if (settings_show_mail || settings_show_message) {
                var template = "Hi #Receiver#,";
                if (getValue("settings_show_mail_coordslink") == true || getValue("settings_show_message_coordslink") == true) template += "\n\n#GCTBName# #GCTBLink#";
                if (getValue("settings_mail_signature", "") != "") template += "\n\n" + getValue("settings_mail_signature");
                setValue("settings_mail_signature", template);
            }
            setValue("migration_task_01", true);
        }
    }

// Aktuelles Datum, Zeit.
    function getDateTime() {
        var now = new Date();
        var aDate = $.datepicker.formatDate('dd.mm.yy', now);
        var hrs = now.getHours();
        var min = now.getMinutes();
        hrs = ((hrs < 10) ? '0' + hrs : hrs);
        min = ((min < 10) ? '0' + min : min);
        var aTime = hrs+':'+min;
        var aDateTime = aDate+' '+aTime;
        return [aDate, aTime, aDateTime];
    }

// GC/TB Name, GC/TB Link, GC/TB Name Link, vorläufiges LogDate.
    function getGCTBInfo(newLogPage) {
        var GCTBName = ""; var GCTBLink = ""; var GCTBNameLink = ""; var LogDate = "";
        if (newLogPage) {
            if ($('#LogDate'[0])) var LogDate = $('#LogDate')[0].value;
            if ($('.muted')[0] && $('.muted')[0].children[0]) {
                var GCTBName = $('.muted')[0].children[0].innerHTML;
                GCTBName = GCTBName.replace(/'/g,"");
                var GCTBLink = $('.muted')[0].children[0].href;
                var GCTBNameLink = "[" + GCTBName + "](" + GCTBLink + ")";
            }
        } else {
            if ($('#uxDateVisited')[0]) var LogDate = $('#uxDateVisited')[0].value;
            if ($('#ctl00_ContentBody_LogBookPanel1_WaypointLink')[0].nextSibling.nextSibling) {
                var GCTBName = $('#ctl00_ContentBody_LogBookPanel1_WaypointLink')[0].nextSibling.nextSibling.nextSibling.innerHTML;
                GCTBName = GCTBName.replace(/'/g,"");
                var GCTBLink = $('#ctl00_ContentBody_LogBookPanel1_WaypointLink')[0].href;
                var GCTBNameLink = "[" + GCTBName + "](" + GCTBLink + ")";
            }
        }
        return [GCTBName, GCTBLink, GCTBNameLink, LogDate];
    }

// Show, hide Box. Z.B.: Beide VIP Boxen im Cache Listing.
    function showHideBoxCL(id_lnk, first) {
        if (id_lnk.match("lnk_gclh_config_")) var is_config = true;
        else is_config = false;
        var name_show_box = id_lnk.replace("lnk_", "show_box_");
        var id_box = id_lnk.replace("lnk_", "");
        var show_box = getValue(name_show_box, true);
        if (document.getElementById(id_lnk)) var lnk = document.getElementById(id_lnk);
        if (document.getElementById(id_box)) var box = $('#' + id_box);
        if (!box) {
            if (document.getElementsByClassName(id_box)) var box = $('.' + id_box);
        }
        if (lnk && box) {
            if ((show_box == true && first == true) || (show_box == false && first == false)) {
                setShowHide(lnk, "hide", is_config);
                box.show();
                var showHide = "hide";
                setValue(name_show_box, true);
                if (!first && is_config) {
                    document.getElementById(id_lnk).scrollIntoView();
                    window.scrollBy(0, -15);
                }
            } else {
                setShowHide(lnk, "show", is_config);
                box.hide();
                var showHide = "show";
                setValue(name_show_box, false);
            }
            return showHide;
        }
    }
    function setShowHide(row, whatToDo, is_config) {
        if (whatToDo == "show") {
            row.title = "show";
            if (is_config == true) {
                row.src = global_plus_config2;
                row.parentNode.className += " gclh_hide";
            } else row.src = "/images/plus.gif";
        } else {
            row.title = "hide";
            if (is_config == true) {
                row.src = global_minus_config2;
                row.parentNode.className = row.parentNode.className.replace(" gclh_hide","");
            } else row.src = "/images/minus.gif";
        }
        if (is_config == true) row.title += " topic\n(all topics with right mouse)";
    }

// Waypoint evaluations.
    function getWaypointTable() {
        var tbl = $("#ctl00_ContentBody_Waypoints");
        if (tbl.length <= 0) tbl = $("#ctl00_ContentBody_WaypointList");
        return tbl;
    }

// Trim decimal value to a given number of digits.
    function roundTO(val, decimals) {return Number(Math.round(val+'e'+decimals)+'e-'+decimals);}

    function queryListingWaypoints( original ) {
        var waypoints = [];
        try {
            if (unsafeWindow.mapLatLng == undefined) {
                return [];
            }

            var gccode = ($('#ctl00_ContentBody_CoordInfoLinkControl1_uxCoordInfoCode')[0]) ? $('#ctl00_ContentBody_CoordInfoLinkControl1_uxCoordInfoCode')[0].textContent : "n/a";

            var ListingCoords = {
                name: unsafeWindow.mapLatLng.name,
                gccode: gccode,
                prefix: "",
                source: "listing",
                typeid: unsafeWindow.mapLatLng.type,
                latitude: unsafeWindow.mapLatLng.lat,
                longitude: unsafeWindow.mapLatLng.lng,
                prefixedName: gccode,
            };
            waypoints.push(ListingCoords);

            if ( original && unsafeWindow.mapLatLng.isUserDefined == true ) {
                var OriginalCoords = Object.assign({}, ListingCoords); // create a copy
                OriginalCoords.latitude = unsafeWindow.mapLatLng.oldLatLng[0];
                OriginalCoords.longitude = unsafeWindow.mapLatLng.oldLatLng[1];
                OriginalCoords.source = "original";
                waypoints.push(OriginalCoords);
            }

            for ( var i=0; i<cmapAdditionalWaypoints.length; i++ ) {
                var waypoint = {
                    name: cmapAdditionalWaypoints[i].name,
                    gccode: gccode,
                    prefix: cmapAdditionalWaypoints[i].pf,
                    source: "waypoint",
                    typeid: cmapAdditionalWaypoints[i].type,
                    latitude: cmapAdditionalWaypoints[i].lat,
                    longitude: cmapAdditionalWaypoints[i].lng,
                    prefixedName: cmapAdditionalWaypoints[i].pf+gccode.substring(2),
                };
                waypoints.push(waypoint);
            }

        } catch(e) {gclh_error("queryListingWaypoints()",e);}
        return waypoints;
    }

// Calculate tile numbers X/Y from latitude/longitude or reverse.
    function lat2tile(lat,zoom)  {return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom)));}
    function long2tile(lon,zoom) {return (Math.floor((lon+180)/360*Math.pow(2,zoom)));}
    function tile2long(x,z) {return (x/Math.pow(2,z)*360-180);}
    function tile2lat(y,z) {var n=Math.PI-2*Math.PI*y/Math.pow(2,z); return (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));}

// Build box for VIPS, VUPS, All Links, Linklist on dashboard.
    function buildDashboardCss() {
        var css = "";
        css += ".link-header.gclh {padding: 12px 20px !important; cursor: pointer; border-top: 1px solid #e4e4e4;}";
        css += ".link-header.gclh svg {height: 22px; width: 22px; fill: #777; float: right; padding-right: 1px; margin-top: -2px; transition: all .3s ease; transform-origin: 50% 50%;}";
        css += ".link-header.gclh.isHide svg {transform: rotate(90deg);}";
        css += ".link-block.gclh {padding-top: 0px; border-bottom: unset; display: block;}";
        css += ".link-block.gclh a:hover {text-decoration: underline; color: #02874d;} .link-block.gclh a {padding: 0 4px 0 0; font-size: 14px;}";
        css += ".link-block.isHide {display: none !important} .link-block {border-bottom: unset;}";
        appendCssStyle(css);
    }
    function buildBoxDashboard(ident, name, title) {
        if (!$("nav.sidebar-links")[1]) return;
        var head = document.createElement("h3");
        head.setAttribute("class", (getValue("show_box_dashboard_" + ident, true) == true ? "link-header gclh" : "link-header gclh isHide"));
        head.setAttribute("name", "head_" + ident);
        if (title) head.setAttribute("title", title);
        if (name) head.innerHTML = name + " <svg><use xlink:href='/account/app/ui-icons/sprites/global.svg#icon-expand-svg-fill'></use></svg>";
        head.addEventListener("click", showHideBoxDashboard, false);
        $("nav.sidebar-links")[1].appendChild(head);
        var box = document.createElement("ul");
        box.setAttribute("class", (getValue("show_box_dashboard_" + ident, true) == true ? "link-block gclh" : "link-block gclh isHide"));
        box.setAttribute("name", "box_" + ident);
        $("nav.sidebar-links")[1].appendChild(box);
    }
    function buildCopyOfBookmarks() {
        var bm_tmp = new Array();
        for (var i = 0; i < bookmarks.length; i++) {
            bm_tmp[i] = new Object();
            for (attr in bookmarks[i]) {bm_tmp[i][attr] = bookmarks[i][attr];}
        }
        return bm_tmp;
    }
    function buildBoxElementsLinklist(box) {
        for (var i = 0; i < settings_bookmarks_list.length; i++) {
            var x = settings_bookmarks_list[i];
            if (typeof(x) == "undefined" || x == "" || typeof(x) == "object") continue;
            var a = document.createElement("a");
            for (attr in bookmarks[x]) {
                if (attr == "custom" || attr == "title") continue;
                if (attr == "name" || attr == "id") a.setAttribute(attr, bookmarks[x][attr]+"_profile");
                else a.setAttribute(attr, bookmarks[x][attr]);
            }
            a.appendChild(document.createTextNode(bookmarks[x]['title']));
            var li = document.createElement("li");
            li.appendChild(a);
            box.appendChild(li);
        }
    }
    function buildBoxElementsLinks(box, bm_tmp) {
        for (var i = 0; i < bm_tmp.length; i++) {
            if (bm_tmp[i]['origTitle'] == "(empty)" || bm_tmp[i]['href'] == "" || bm_tmp[i]['href'] == "#") continue;
            var a = document.createElement("a");
            for (attr in bm_tmp[i]) {
                if (attr == "custom" || attr == "title" || attr == "origTitle") continue;
                if (attr == "name" || attr == "id") a.setAttribute(attr, bm_tmp[i][attr]+"_profile");
                else a.setAttribute(attr, bm_tmp[i][attr]);
            }
            a.appendChild(document.createTextNode(bm_tmp[i]['origTitle']));
            var li = document.createElement("li");
            li.appendChild(a);
            box.appendChild(li);
        }
    }

// Show, Hide box on dashboard.
    function showHideBoxDashboard() {
        if (!$(this.nextElementSibling)) return;
        var ident = this.getAttribute("name").replace("head_", "");
        (this.className.match("isHide") ? setValue("show_box_dashboard_" + ident, true) : setValue("show_box_dashboard_" + ident, false));
        (this.className.match("isHide") ? $(this.nextElementSibling).removeClass("isHide") : $(this.nextElementSibling).addClass("isHide"));
        (this.className.match("isHide") ? $(this).removeClass("isHide") : $(this).addClass("isHide"));
    }

// Show log counter.
    function showLogCounterLink() {
        addButtonOverLogs(showLogCounter, "gclh_show_log_counter", true, "Show log counter", "Show log counter for log type and total");
        if (settings_show_log_counter_but && settings_show_log_counter) showLogCounter();
        appendCssStyle(".gclh_logCounter {font-size: 10px !important; padding-left: 6px; font-style: italic;}");
    }
    function showLogCounter() {
        try {
            $('#gclh_show_log_counter').addClass("working");
            setTimeout(function() {
                var logCounter = new Object();
                logCounter["all"] = 0;
                var logTypes = $('.LogTotals a');
                for (var i = 0; i < logTypes.length; i++) {
                    var matches = logTypes[i].innerHTML.replace(/(,|\.)/g, "").match(/>(\s*)(\d+)/);
                    if (matches && matches[2]) {
                        logCounter[logTypes[i].childNodes[0].title] = parseInt(matches[2]);
                        logCounter["all"] += parseInt(matches[2]);
                    }
                }
                if (logCounter["all"] != 0) {
                    var logs = $('#cache_logs_table2').find('tbody tr td').find('.LogType');
                    for (var i = 0; i < logs.length; i++) {
                        var log = logs[i];
                        if (log && log.children[1] && log.children[0].children[0].title && logCounter[log.children[0].children[0].title]) {
                            var logTyp = log.children[0].children[0].title;
                            log.children[1].innerHTML = " Log " + logCounter[logTyp] + " / Total Log " + logCounter["all"];
                            logCounter[logTyp]--;
                            logCounter["all"]--;
                        }
                    }
                }
                $('#gclh_show_log_counter').removeClass("working");
            }, 100);
        } catch(e) {gclh_error("showLogCounter",e);}
    }

// Show/Hide comapct logs.
    function toggle_compact_logbook(){
        $('#cache_logs_container').toggleClass('compact_logbook');
        if ($('#cache_logs_container').hasClass('compact_logbook')) {
            $('#toggle_compact_logbook')[0].children[0].value = 'Hide compact logs';
        } else {
            $('#toggle_compact_logbook')[0].children[0].value = 'Show compact logs';
        }
    }

// Add button over logs in cache listing.
    function addButtonOverLogs(func, id, right, txt, title) {
        if (!$('#ctl00_ContentBody_uxLogbookLink')[0]) return;
        var span = document.createElement("span");
        span.id = id;
        span.innerHTML = '<input type="button" href="javascript:void(0);" title="'+title+'" value="'+txt+'">';
        span.addEventListener("click", func, false);
        if (right) span.className = "gclh_rlol";
        else span.className = "gclh_llol";
        if ($('.gclh_llol').length == 0 && $('.gclh_rlol').length == 0) {
            appendCssStyle(".gclh_llol {margin-right: 4px;} .gclh_rlol {float: right; margin-right: 4px;} .gclh_llol.working input, .gclh_rlol.working input {opacity: 0.3;}");
            $('#ctl00_ContentBody_uxLogbookLink')[0].parentNode.style.width = "100%";
            $('#ctl00_ContentBody_uxLogbookLink')[0].parentNode.style.margin = "0";
        }
        $('#ctl00_ContentBody_uxLogbookLink')[0].parentNode.append(span);
    }

// Ist Seite eigene Statistik?
    function isOwnStatisticsPage(){
        if ((document.location.href.match(/\.com\/my\/statistics\.aspx/)) ||
            (is_page("publicProfile") && $('#ctl00_ContentBody_lblUserProfile')[0].innerHTML.match(global_me) && $('#ctl00_ContentBody_ProfilePanel1_lnkStatistics.Active')[0])) {
            return true;
        } else return false;
    }

// Consideration of special keys ctrl, alt, shift on keyboard input.
    function noSpecialKey(e) {
        if (e.ctrlKey != false || e.altKey != false || e.shiftKey != false) return false;
        else return true;
    }

// User, guid aus nachgelesenem alten oder neuem Public Profile ermitteln.
    function getUserGuidFromProfile(respText) {
        var user = respText.match(/id="ctl00_(ProfileHead_ProfileHeader|ContentBody_ProfilePanel1)_lblMemberName">(.*?)<\/span>/);
        var guid = respText.match(/href="\/account\/messagecenter\?recipientId=(.*?)"/);
        if (user && user[1] && user[2] && guid && guid[1]) {
            var span = document.createElement('span');
            span.innerHTML = user[2];
            var username = decode_innerHTML(span);
            return [username, guid[1]];
        }

        return [false, false];
    }

// User aus url ermitteln.
    function getUrlUser() {
        var urluser = document.location.href.match(/\.com\/seek\/nearest\.aspx(.*)(\?ul|\?u|&ul|&u)=(.*)/);
        urluser = urldecode(urluser[3].replace(/&([A-Za-z0-9]+)=(.*)/, ""));
        urluser = urluser.replace(/&disable_redirect=/, "");
        if (!urluser.match(/^#/)) urluser = urluser.replace(/#(.*)/, "");
        return urluser;
    }

// Alternative to event load on map. (Load event on map doesn't work always with open in new tab.)
    function isMapLoad(fkt) {
        if (waitCount == undefined) var waitCount = 0;
        if ($('.groundspeak-control-findmylocation')[0] && $('.leaflet-control-scale')[0]) fkt();
        else {waitCount++; if (waitCount <= 50) setTimeout(function(){isMapLoad(fkt);}, 200);}
    }

//////////////////////////////
// User defined searchs Main
//////////////////////////////
    function create_config_css_search() {
        var html = "";
        html += ".btn-context {";
        html += "  border: 0;";
        html += "  height: 40px;";
        html += "  margin-top: -4px;";
        html += "  text-indent: -9999px;";
        html += "  width: 30px;";
        html += "  margin-left: -8px;";
        html += "  margin-right: 10px;}";
        html += ".btn-user {";
        html += "  background-color: transparent;";
        html += "  background-image: none;";
        html += "  border-color: #fff;";
        html += "  border-radius: 3px;";
        html += "  clear: both;";
        html += "  color: #fff;";
        html += "  margin-top: 0px;}";
        html += ".filters-toggle {";
        html += "  display: inline-flex;}";
        html += ".btn-user-active, .btn-user:hover, .btn-user:active {";
        html += "  background-color: #00b265;";
        html += "  border-color: #00b265;}";
        html += ".btn-iconsvg {";
        html += "  -webkit-appearance: none;";
        html += "  width: unset !important;}";
        html += ".btn-iconsvg svg {";
        html += "  width: 22px;";
        html += "  height: 22px;";
        html += "  margin-right: 3px;}";
        html += ".add-list li {";
        html += "  padding: 2px 0;}";
        html += ".add-list {";
        html += "  padding-bottom: 5px;}";
        appendCssStyle(html);
    }
    function saveFilterSet() {setValue("settings_search_data", JSON.stringify(settings_search_data));}
    function actionOpen(id) {
        for (var i = 0; i < settings_search_data.length; i++) {
            if (settings_search_data[i].id == id) {
                document.location.href = settings_search_data[i].url;
                break;
            }
        }
    }
    function actionRename(id, name) {
        for (var i = 0; i < settings_search_data.length; i++) {
            if (settings_search_data[i].id == id) {
                settings_search_data[i].name = name;
                saveFilterSet();
                break;
            }
        }
    }
    function actionUpdate(id, page) {
        for (var i = 0; i < settings_search_data.length; i++) {
            if (settings_search_data[i].id == id) {
                settings_search_data[i].url = page.split("#")[0];
                settings_search_data[i].url = settings_search_data[i].url.replace(/&MfsId=(\d+)/, "") + "&MfsId=" + settings_search_data[i].id;
                saveFilterSet();
                break;
            }
        }
    }
    function actionNew(name, page) {
        // Find latest id.
        var i = settings_search_data.length;
        var id = -1;
        for (var i = 0; i < settings_search_data.length; i++) {
            if (id < settings_search_data[i].id) id = settings_search_data[i].id;
        }
        settings_search_data[i] = {};
        settings_search_data[i].id = id+1;
        settings_search_data[i].name = name;
        settings_search_data[i].url = page.split("#")[0];
        settings_search_data[i].url = settings_search_data[i].url.replace(/&MfsId=(\d+)/, "") + "&MfsId=" + settings_search_data[i].id;
        saveFilterSet();
    }
    function actionSearchDelete(id) {
        var tmp = [];
        for (var i = 0; i < settings_search_data.length; i++) {
            if (settings_search_data[i].id != id) tmp[tmp.length] = settings_search_data[i];
        }
        settings_search_data = tmp;
        saveFilterSet();
    }
    function updateUI() {
        if ($("#searchContextMenu").length == 0) {
            var html = "";
            html += '<div id="searchContextMenu" class="pop-modal" style="top: 110px; left: 20%; width: 60%; position: absolute;">';
            html += '<div id="filter-new" class="add-menu" style="display: none;"><label for="newListName">Save current Filter Set</label>';
            html += '<div class="input-control active"><input id="nameSearch" name="newListName" maxlength="150" placeholder="New Name" type="text">';
            html += '<div class="add-list-status"><button id="btn-save" class="add-list-submit" type="button" style="display: inline-block;">Save</button></div></div></div>';
            html += '<div id="filter-edit" class="add-menu" style="display: none;"><label for="newListName">Edit Filter Set <i><span id="filterName"></span></i></label>';
            html += '<div class="input-control active"><input id="filter-name-rename" name="newListName" maxlength="150" placeholder="New Name" type="text">';
            html += '<div class="add-list-status"><button id= "btn-rename" class="add-list-submit" type="button" style="display: inline-block;">Rename</button></div>';
            html += '<div id="div-btn-update" class="add-list-status"><button id="btn-update" class="add-list-submit" type="button" style="display: inline-block;">Update</button></div></div></div><label class="add-list-label">Available Filter Sets</label><ul id="filterlist" class="add-list"></ul></div>';
            $("#ctxMenu").html(html);
            $('#btn-save').click(function() {
                var name = $("#nameSearch").val();
                if (name == "") {
                    alert("Insert name!");
                    $("#nameSearch").css('background-color', '#ffc9c9');
                    return;
                } else {
                    actionNew(name, document.location.href);
                    $("#nameSearch").css('background-color', '#ffffff');
                }
                hideCtxMenu();
            });
            $('#btn-rename').click(function() {
                var id = $(this).data('id');
                var name = $("#filter-name-rename").val();
                actionRename(id, name);
                updateUI();
            });
            $('#btn-update').click(function() {
                var id = $(this).data('id');
                var update = (document.location.href.indexOf("?")>=0?true:false);
                if (update) {
                    actionUpdate(id, document.location.href);
                    hideCtxMenu();
                }
            });
        }
        $("#filter-edit").hide();
        if ($(".results").length != 0) $("#filter-new").show();
        var html = "";
        if (settings_search_data.length) {
            settings_search_data.sort(function(a, b){return a.name.toUpperCase()>b.name.toUpperCase();});
        }
        for (var i = 0; i < settings_search_data.length; i++) {
            html += '<li data-id="'+settings_search_data[i].id+'">';
            var id = 'data-id="'+settings_search_data[i].id+'"';
            var t = (settings_search_data[i].url == document.location.href.split("#")[0])?true:false;
            html += '<button type="button" class="btn-item-action action-open" '+id+'>'+(t?'<b>':'')+settings_search_data[i].name+(t?'</b>':'')+'</button>';
            html += '<div type="button" title="Remove Filter Set" class="status btn-iconsvg action-delete" '+id+'><svg class="icon icon-svg-button" role="presentation"><use xlink:href="/account/app/ui-icons/sprites/global.svg#icon-delete"></use></svg></div>';
            html += '<div type="button" title="Change Filter Set" style="right: 50px;" class="status btn-iconsvg action-rename" '+id+'><svg class="icon icon-svg-button" role="presentation"><use xlink:href="/account/app/ui-icons/sprites/global.svg#icon-more"></use></svg></div>';
            html += '</li>';
        }
        $("#filterlist").html(html);
        $('.action-open').click(function() {
            var id = $(this).data('id');
            actionOpen(id);
        });
        $('.action-delete').click(function() {
            var id = $(this).data('id');
            actionSearchDelete(id);
            updateUI();
        });
        $('.action-rename').click(function() {
            var id = $(this).data('id');
            $('#filter-new').hide();
            $('#filter-edit').show();
            $('#btn-rename').data('id', id);
            $('#btn-update').data('id', id);
            var update = (document.location.href.indexOf("?")>=0?true:false);
            if (update) $('#div-btn-update').show();
            else $('#div-btn-update').hide();
            $("#filter-name-rename").val("n/a");
            for (var i = 0; i < settings_search_data.length; i++) {
                if (settings_search_data[i].id == id) {
                    $("#filter-name-rename").val(settings_search_data[i].name);
                    $('#filterName').text(settings_search_data[i].name);
                    break;
                }
            }
        });
    }
    function hideCtxMenu() {
        $('#ctxMenu').hide();
        $('#filterCtxMenu').removeClass('btn-user-active');
    }

    if (settings_search_enable_user_defined && is_page("find_cache")) {
        try {
            if (!($(".results").length || settings_search_data.length)) {
            } else {
                create_config_css_search();
                $(".filters-toggle").append('&nbsp;<button id="filterCtxMenu" class="btn btn-user" type="button">Manage Filter Sets</button>  ');
                $(".filters-toggle").append('<div id="ctxMenu" style="display:none;"></div>');
                $('#filterCtxMenu').click(function() {
                    var element = $('#ctxMenu');
                    if (element.css('display') == 'none'){
                       updateUI();
                       element.show();
                       $(this).addClass('btn-user-active');
                    } else {
                       element.hide();
                       $(this).removeClass('btn-user-active');
                    }
                });
                var currentFilter = "";
                for (var i = 0; i < settings_search_data.length; i++) {
                    if (settings_search_data[i].url == document.location.href.split("#")[0]) {
                        currentFilter = "Current Filter Set: "+settings_search_data[i].name;
                    }
                }
                $(".button-group-dynamic").append('<span>'+currentFilter+'</span>');
                // Close the dialog div if a mouse click outside.
                $(document).mouseup(function(e) {
                    var container = $('#ctxMenu');
                    if (container.css('display') != 'none') {
                        if (!container.is(e.target) && !($('#filterCtxMenu').is(e.target)) &&  // If the target of the click isn't the container...
                            container.has(e.target).length === 0) {  // ... nor a descendant of the container
                            container.hide();
                            $('#filterCtxMenu').removeClass('btn-user-active');
                        }
                    }
                    return false;
                });
            }
        } catch(e) {gclh_error("User defined search",e);}
    }

//////////////////////////////
// Find Player Main
//////////////////////////////
// Create and hide the "Find Player" Form.
    function createFindPlayerForm() {
        btnClose();
        if (checkTaskAllowed("Find Player", true) == false) return;
        if ($('#bg_shadow')[0]) {
            if ($('#bg_shadow')[0].style.display == "none") $('#bg_shadow')[0].style.display = "";
        } else buildBgShadow();
        if ($('#findplayer_overlay')[0] &&$('#findplayer_overlay')[0].style.display == "none") $('#findplayer_overlay')[0].style.display = "";
        else {
            var html = "";
            html += "#findplayer_overlay {";
            html += "  background-color: #d8cd9d;";
            html += "  width:350px;";
            html += "  border: 2px solid #778555;";
            html += "  overflow: auto;";
            html += "  padding:10px;";
            html += "  position: absolute;";
            html += "  left:30%;";
            html += "  top:60px;";
            html += "  z-index:1001;";
            html += "  border-radius: 30px;";
            html += "  overflow: auto;}";
            html += ".gclh_form {";
            html += "  background-color: #d8cd9d !important;";
            html += "  border: 2px solid #778555 !important;";
            html += "  border-radius: 7px !important;";
            html += "  padding-left: 5px !important;";
            html += "  padding-right: 5px !important;";
            html += "  font-family: inherit;";
            html += "  font-size: 13px !important;";
            html += "  font-weight: normal !important;";
            html += "  margin: 0px !important;";
            html += "  color: rgb(0, 0, 0) !important;";
            html += "  padding-top: 0px !important;";
            html += "  padding-bottom: 0px !important;";
            html += "  box-shadow: unset !important;";
            html += "  display: unset;}";
            appendCssStyle(html, "body");
            // Overlay erstellen
            var html = "";
            html += "<h3 style='margin:5px; font-weight: bold; font-size: 19.5px; line-height: 1; color: #594a42;'>Find Player</h3>";
            html += "<form style='text-align: unset;' action=\"/find/default.aspx\" method=\"post\" name=\"aspnetForm\" >";
            html += "<input class='gclh_form' type='hidden' name='__VIEWSTATE' value=''>";
            html += "<input style='width: 170px;' class='gclh_form' id='findplayer_field' class=\"Text\" type=\"text\" maxlength=\"100\" name=\"ctl00$ContentBody$FindUserPanel1$txtUsername\"/>";
            html += " <input style='cursor: pointer;' class='gclh_form' type=\"submit\" value=\"go\" name=\"ctl00$ContentBody$FindUserPanel1$GetUsers\"/>";
            html += " <input style='cursor: pointer;' class='gclh_form' id='btn_close1' type='button' value='close'>";
            html += "</form>";
            var side = $('body')[0];
            var div = document.createElement("div");
            div.setAttribute("id", "findplayer_overlay");
            div.setAttribute("align", "center");
            div.innerHTML = html;
            div.appendChild(document.createTextNode(""));
            side.appendChild(div);
            $('#btn_close1')[0].addEventListener("click", btnClose, false);
        }
        if ($('.hover.open')[0]) $('.hover.open')[0].className = "";
        $('#findplayer_field')[0].focus();
    }

//////////////////////////////
// Config Main
//////////////////////////////
    function checkboxy(setting_id, label) {
        // Hier werden auch gegebenenfalls "Clone" von Parametern verarbeitet. (Siehe Erläuterung weiter unten bei "setEvForDouPara".)
        var setting_idX = setting_id;
        setting_id = setting_idX.replace(/(X[0-9]*)/, "");
        return "<input type='checkbox' " + (getValue(setting_id) ? "checked='checked'" : "" ) + " id='" + setting_idX + "'><label for='" + setting_idX + "'>" + label + "</label>";
    }
    function show_help(text) {return " <a class='gclh_info'><b>?</b><span class='gclh_span'>" + text + "</span></a>";}
    function show_help2(text) {return " <a class='gclh_info gclh_info2'><b>?</b><span class='gclh_span'>" + text + "</span></a>";}
    function show_help3(text) {return " <a class='gclh_info gclh_info3'><b>?</b><span class='gclh_span'>" + text + "</span></a>";}
    function show_help_big(text) {return " <a class='gclh_info gclh_info_big'><b>?</b><span class='gclh_span'>" + text + "</span></a>";}
    function show_help_rc(text) {return " <a class='gclh_info gclh_info_rc'><b>?</b><span class='gclh_span'>" + text + "</span></a>";}

    function create_config_css() {
        var html = "";
        html += ".settings_overlay {";
        html += "  background-color: #d8cd9d;";
        html += "  width: 600px;";
        html += "  border: 2px solid #778555;";
        html += "  overflow: auto;";
        html += "  padding: 10px;";
        html += "  position: absolute;";
        html += "  left: 30%;";
        html += "  top: 10px;";
        html += "  z-index: 1001;";
        html += "  border-radius: 30px;";
        html += "  box-sizing: unset;}";
        html += ".gclh_headline {";
        html += "  height: 21px;";
        html += "  margin: 5px;";
        html += "  background-color: #778555;";
        html += "  color: #FFFFFF;";
        html += "  border-radius: 30px;";
        html += "  text-align: center;";
        html += "  line-height: 1;";
        html += "  font-size: 19.5px;}";
        html += ".gclh_headline2 {";
        html += "  margin: 12px 5px 5px -2px;";
        html += "  line-height: 1.25;";
        html += "  font-size: 1.2em;}";
        html += ".gclh_headline2.gclh_hide {margin-top: 5px;}";
        html += ".gclh_block {";
        html += "  margin-top: 5px;";
        html += "  margin-bottom: 12px;}";
        html += ".gclh_content {";
        html += "  padding: 2px 10px 10px 10px;";
        html += "  font-family: Verdana;";
        html += "  font-size: 14px;";
        html += "  line-height: 1.5;}";
        html += ".gclh_content input, .gclh_content input:focus, .gclh_content input:active, .gclh_content textarea, .gclh_content select, .gclh_content button, .gclh_content pre {";
        html += "  display: inline;";
        html += "  width: unset;";
        html += "  border: 2px solid #778555;";
        html += "  border-radius: 7px;";
        html += "  box-shadow: none;";
        html += "  background: unset;";
        html += "  background-color: #d8cd9d;";
        html += "  background-image: none;";
        html += "  margin: 0;}";
        html += ".gclh_content input, .gclh_content textarea, .gclh_content button, .gclh_content pre {padding: 1px 5px;}";
        html += ".gclh_content input, .gclh_content textarea, .gclh_content button, .gclh_content select {color: rgb(0, 0, 0) !important;}";
        html += ".gclh_content input[type='checkbox'], .gclh_content input:focus[type='checkbox'], .gclh_content input:active[type='checkbox'], .gclh_content input[type='radio'], .gclh_content input:focus[type='radio'], .gclh_content input:active[type='radio'] {";
        html += "  margin-left: 4px;";
        html += "  margin-right: 4px;}";
        html += ".gclh_content input[type='checkbox'] {";
        html += "  opacity: 1;";
        html += "  position: unset;";
        html += "  height: unset;}";
        html += ".gclh_content span::before {display: none !important;}";
        html += ".gclh_content input[type='text'][disabled] {background: unset;}";
        html += ".gclh_content button, .gclh_content input[type='button'] {";
        html += "  cursor: pointer;";
        html += "  box-shadow: 1px 1px 3px 0px rgb(119, 133, 85);}";
        html += ".gclh_content .shadowBig {box-shadow: 1px 1px 3px 1px rgb(119, 133, 85);}";
        html += ".gclh_content textarea, .gclh_content pre {resize: vertical;}";
        html += ".gclh_content select {";
        html += "  -moz-appearance: button;";
        html += "  -webkit-appearance: menulist-button;";  // Chrome
        html += "  cursor: default;";
        html += "  padding: 0;}";
        html += ".gclh_content label {";
        html += "  display: inline;";
        html += "  font-size: 14px;";
        html += "  text-transform: unset;}";
        html += ".gclh_content .gclh_prem {";
        html += "  height: 14px;";
        html += "  vertical-align: baseline;";
        html += "  margin-bottom: -2px;}";
        html += ".gclh_content a {";
        html += "  text-decoration: none;";
        html += "  color: #3d76c5;}";
        html += ".gclh_content a:hover, .gclh_content a:active, .gclh_content a:focus {";
        html += "  text-decoration: underline;";
        html += "  color: #3d76c5;}";
        html += ".gclh_content table {";
        html += "  margin-bottom: 0px;";
        html += "  font-size: 14px;}";
        html += ".gclh_content th {font-weight: bold;}";
        html += ".gclh_content td, .gclh_content th {";
        html += "  padding: 0px 0px 0px 4px;";
        html += "  vertical-align: middle;}";
        html += ".gclh_content table, .gclh_content thead, .gclh_content tbody, .gclh_content tr, .gclh_content td, .gclh_content th {box-sizing: unset;}";
        html += ".gclh_form {";
        html += "  font-size: 14px !important;";
        html += "  font-family: Verdana !important;";
        html += "  line-height: 18px !important;}";
        html += ".gclh_ref {";
        html += "  color: #000000 !important;";
        html += "  text-decoration: none !important;";
        html += "  border-bottom: dotted 1px black;}";
        html += ".gclh_small {font-size: 10px;}";
        html += "a.gclh_info {";
        html += "  color: #000000 !important;";
        html += "  text-decoration: none;";
        html += "  cursor: help;";
        html += "  white-space: normal;}";
        html += "a.gclh_info:hover {";
        html += "  position: relative;";
        html += "  padding-bottom: 10px;}";
        html += "a.gclh_info span {";
        html += "  visibility: hidden;";
        html += "  position: absolute; top:-310px; left:0px;";
        html += "  padding: 2px;";
        html += "  text-decoration: none;";
        html += "  text-align: left;";
        html += "  vertical-align: top;";
        html += "  font-size: 12px;";
        html += "  z-index: 105;}";
        html += "a.gclh_info:hover span {";
        html += "  width: 250px;";
        html += "  visibility: visible;";
        html += "  top: 20px;";
        html += "  left: -125px;";
        html += "  font-weight: normal;";
        html += "  border: 1px solid #000000;";
        html += "  background-color: #d8cd9d;}";
        html += "a.gclh_info2:hover span {left: -80px !important;}";
        html += "a.gclh_info3:hover span {";
        html += "  left: -200px !important;}";
        html += "a.gclh_info_big:hover span {width: 350px !important;}";
        html += "table.multi_homezone_settings {";
        html += "  margin: -2px 0 5px 10px;;";
        html += "  width: 550px;";
        html += "  text-align: left;";
        html += "  vertical-align: baseline;";
        html += "  white-space: nowrap;}";
        html += ".multi_homezone_settings .remove {";
        html += "  height: 20px;";
        html += "  margin-left: 0px;";
        html += "  vertical-align: top;";
        html += "  cursor: pointer;}";
        html += ".multi_homezone_settings .disabled {";
        html += "  cursor: unset !important;";
        html += "  opacity: 0.5;}";
        html += ".multi_homezone_settings .addentry {margin-top: 2px;}";
        html += "a.gclh_info_rc:hover span {";
        html += "  width: 500px !important;";
        html += "  left: -245px !important;}";
        html += ".gclh_rc_area, .gclh_thanks_area {";
        html += "  z-index: 1001;";
        html += "  border: 1px solid #778555;";
        html += "  border-radius: 30px;";
        html += "  padding: 20px;";
        html += "  margin-top: 15px;}";
        html += ".gclh_rc_area_button {margin-left: 185px;}";
        html += ".gclh_rc_form, .gclh_thanks_form {";
        html += "  margin-bottom: 15px !important;";
        html += "  margin-left: 15px !important;}";
        html += ".gclh_thanks_area_button {margin-left: 230px;}";
        html += ".gclh_thanks_table {";
        html += "  border-collapse: collapse;";
        html += "  border: 2px solid #d8cd9d !important; }";
        html += ".gclh_thanks_table th {";
        html += "  border: 1px solid #778555;";
        html += "  border-bottom-width: 2px;";
        html += "  padding: 0px 4px;";
        html += "  vertical-align: initial;";
        html += "  font-weight: initial;}";
        html += ".gclh_thanks_table th span:not(.gclh_span) {font-variant: all-petite-caps;}";
        html += ".gclh_thanks_table th:nth-child(1) {";
        html += "  border-right-width: 2px;";
        html += "  max-width: 100px;}";
        html += ".gclh_thanks_table td {";
        html += "  border: 1px solid #778555;";
        html += "  vertical-align: initial;";
        html += "  text-align: center;}";
        html += ".gclh_thanks_table td:nth-child(1) {";
        html += "  border-right-width: 2px;";
        html += "  max-width: 100px;";
        html += "  padding: 0px 4px;";
        html += "  text-align: initial;}";
        html += ".gclh_thanks_table td:nth-child(1) a {";
        html += "  max-width: 100px;";
        html += "  display: inline-block;";
        html += "  overflow: hidden;";
        html += "  vertical-align: bottom;";
        html += "  white-space: nowrap;";
        html += "  text-overflow: ellipsis;}";
        html += ".gclh_thanks_table td img {vertical-align: text-top}";
        html += ".gclh_thanks_table tr.separator td {border-bottom-width: 2px;}";
        html += ".ll_heading {";
        html += "  margin-top: 0px;";
        html += "  margin-bottom: 0px;";
        html += "  font-family: Verdana;";
        html += "  font-size: 14px;";
        html += "  font-style: normal;";
        html += "  font-weight: bold;}";
        html += ".gclh_old_new_line {";
        html += "  font-size: 14px;";
        html += "  font-style: italic;";
        html += "  font-weight: bold;";
        html += "  margin-top: 12px;";
        html += "  margin-bottom: 3px;";
        html += "  margin-left: 5px;}";
        appendCssStyle(html, "body");
    }

    var t_reqChl = "This option requires \"Change header layout\".";
    var t_reqLlwG = "This option requires \"Load logs with GClh\".";
    var t_reqSVl = "This option requires \"Show VIP list\".";
    var t_reqMDTc = "This option requires \"Mark D/T combinations for your next possible cache matrix\".";
    var t_reqChlSLoT = "This option requires \"Change header layout\" and \"Show Linklist on top\".";
    var t_reqSLoT = "This option requires \"Show Linklist on top\".";
    var prem = " <img class='gclh_prem' title='The underlying feature of GC is a premium feature.' src='" + global_premium_icon + "'> ";
    var dt_display = [ ["greater than or equal to",">="], ["equal to","="], ["less than or equal to","<="] ];
    var dt_score = [ ["1","1"], ["1.5","1.5"], ["2","2"], ["2.5","2.5"], ["3","3"], ["3.5","3.5"], ["4","4"], ["4.5","4.5"], ["5","5"] ];

    function gclh_createSelectOptionCode(id, data, selectedValue) {
        var html = "";
        html += '<select class="gclh_form" id="'+id+'">';
        for (var i = 0; i < data.length; i++) {
            html += "  <option value='" + data[i][1] + "' " + (selectedValue == data[i][1] ? "selected='selected'" : "") + "> " + data[i][0] + "</option>";
        }
        html += '</select>';
        return html;
    }

// Configuration Menü.
    function gclh_showConfig() {
        btnClose(false);
        if (checkTaskAllowed("GClh Config", true) == false) return;
        window.scroll(0, 0);
        if ($('#bg_shadow')[0]) {
            if ($('#bg_shadow')[0].style.display == "none") $('#bg_shadow')[0].style.display = "";
        } else buildBgShadow();
        if (settings_make_config_main_areas_hideable && !document.location.href.match(/#a#/i)) {
            var prepareHideable = "<img id='lnk_gclh_config_#name#' title='' src='' style='cursor: pointer'> ";
        } else var prepareHideable = "";
        if ($('#settings_overlay')[0] && $('#settings_overlay')[0].style.display == "none") {
            $('#gclh_config_content_thanks').hide();
            $('#gclh_config_content1').show();
            $('#gclh_config_content3').show();
            $('#settings_overlay')[0].style.display = "";
        } else {
            create_config_css();
            var div = document.createElement("div");
            div.setAttribute("id", "settings_overlay");
            div.setAttribute("class", "settings_overlay");
            var html = "";
            html += "<h3 class='gclh_headline' title='Some little things to make life easy (on www.geocaching.com).' >" + scriptNameConfig + " <font class='gclh_small'>v" + scriptVersion + "</font></h3>";
            html += "<div class='gclh_content'>";

            html += "<div id='gclh_config_content1'>";
            html += "&nbsp;" + "<font style='float: right; font-size: 11px; ' >";
            html += "<a href='http://geoclub.de/forum/viewforum.php?f=117' title='Help is available on the Geoclub forum' target='_blank'>Help</a> | ";
            html += "<a href='"+urlFaq+"' title='Frequently asked questions on GitHub' target='_blank'>FAQ</a> | ";
            html += "<a href='https://github.com/2Abendsegler/GClh/issues?q=is:issue is:open sort:created-desc' title='Show/open issues on GitHub' target='_blank'>Issues</a> | ";
            html += "<a href='"+urlChangelog+"' title='Documentation of changes and new features on GitHub' target='_blank'>Changelog</a> | ";
            html += "<a id='check_for_upgrade' href='#' style='cursor: pointer' title='Check for new version'>Upgrade</a> | ";
            html += "<a href='https://github.com/2Abendsegler/GClh/tree/master' title='Development plattform and issue system' target='_blank'>GitHub</a> | ";
            html += "<a id='rc_link' href='#' style='cursor: pointer' title='Reset some configuration data'>Reset</a> | ";
            html += "<a id='thanks_link' href='#' style='cursor: pointer' title='Note of thanks'>Thanks</a></font>";
            html += "</div>";

            html += "<div id='gclh_config_content2'>";
            html += "<div id='rc_area' class='gclh_rc_area'>";
            html += "<input type='radio' name='rc' id='rc_standard' class='gclh_rc'><label for='rc_standard'>Reset to standard configuration</label>" + show_help_rc("This option should help you to come back to an efficient configuration set, after some experimental or other motivated changes. This option load a reasonable standard configuration and overwrite your configuration data in parts. <br><br>The following data are not overwrited: Home coords; Homezone circle and multi Homezone circles; date format; log templates; cache log, TB log and other signatures; friends data; links in Linklist and differing description and custom links. <br>Dynamic data, like for example autovisits for named trackables, are not overwrited too.<br><br>After reset, choose button \"close\" and go to Config to skim over the set of data.") + "<br>";
            html += "<input type='radio' name='rc' checked='checked' id='rc_temp' class='gclh_rc'><label for='rc_temp'>Reset dynamic and unused data</label>" + show_help_rc("This option reorganize the configuration set. Unused parameters of older script versions are deleted. And the dynamic data like the autovisit settings for every TB, the seen friends data of founds and hides and the DropBox token are deleted too. Especially the VIPs, VUPs and Linklist settings are not deleted of course.<br><br>After reset, choose button \"close\".") + "<br><br>";
            html += "<input type='radio' name='rc' id='rc_homecoords' class='gclh_rc'><label for='rc_homecoords'>Reset your own home coords</label>" + show_help_rc("This option could help you with problems around your home coords, like for example with your main Homezone, with nearest lists or with your home coords itself. Your home coords are not deleted at GC, but only in GClh. <br><br>After reset, you have to go to the account settings page of GC to the area \"Home Location\", so that GClh can save your home coords again automatically. You have only to go to this page, you have nothing to do at this page, GClh save your home coords automatically. <br>Or you enter your home coords manually in GClh. <br><br>At last, choose button \"close\".");
            html += "<font class='gclh_small'> (After reset, go to <a href='/account/settings/homelocation' target='_blank'>Home Location</a> )</font>" + "<br>";
            html += "<input type='radio' name='rc' id='rc_uid' class='gclh_rc'><label for='rc_uid'>Reset your own id for your trackables</label>" + show_help_rc("This option could help you with problems with your own trackables lists, which based on an special id, the uid. The uid are not deleted at GC, but only in GClh. <br><br>After reset, you have to go to your dashboard, so that GClh can save your uid again automatically. You have only to go to this page, you have nothing to do at this page, GClh save the uid automatically. <br><br>At last, choose button \"close\".");
            html += "<font class='gclh_small'> (After reset, go to <a href='/my/' target='_blank'>Dashboard</a> )</font>" + "<br><br>";
            html += "<div class='gclh_rc_area_button'>";
            html += "<img id='rc_doing' src='' title='' alt='' style='margin-top: 4px; margin-left: -25px; position: absolute;' /><input class='gclh_rc_form' type='button' value='reset' id='rc_reset_button'> <input class='gclh_rc_form' type='button' value='close' id='rc_close_button'>";
            html += "</div>";
            html += "<pre class='gclh_form' style='display: block; height: 220px; overflow: auto; margin-bottom: 0px; font-size: 12px;' type='text' value='' id='rc_configData' contenteditable='true'></pre>";
            html += "</div>";
            html += "</div>";

            html += "<div id='gclh_config_content_thanks'>";
            html += "<div class='gclh_thanks_area'>";
            html += "There are numerous persons who have shaped and advanced the tool with their time and their know-how. Many thanks to all of you!<br><br>";
            html += "<table class='gclh_thanks_table'>";
            html += "    <thead>";
            html += "        <tr><th></th><th><span>Project Management</span></th><th><span>Development Lead</span></th><th><span>Development</span></th><th><span>Bug Reporting</span>" + show_help3("Bugs reported to the issue system on GitHub.") + "</th></tr>";
            html += "    </thead>";
            html += "    <tbody>";
//--> $$006
            // Bezeichnung:         GC Name                 Abw. GitHub Name   ProjM  DevL   Dev    BugR   Separator
            html += thanksLineBuild("Ruko2010",             "",                true,  true,  false, true,  false);
            html += thanksLineBuild("2Abendsegler",         "",                true,  true,  false, true,  true );
            // Rangliste Development von hier https://github.com/2Abendsegler/GClh/graphs/contributors.
            html += thanksLineBuild("CachingFoX",           "",                false, false, true,  true,  false);
            html += thanksLineBuild("Herr Ma",              "",                false, false, true,  true,  false);
            html += thanksLineBuild("Dratenik",             "",                false, false, true,  false, false);
            html += thanksLineBuild("capoaira",             "",                false, false, true,  false, false);
            html += thanksLineBuild("DrakMrak",             "",                false, false, true,  false, false);
            html += thanksLineBuild("radlerandi",           "",                false, false, true,  false, false);
            html += thanksLineBuild("Nicole1338",           "",                false, false, true,  false, false);
            html += thanksLineBuild("ramirez_",             "ramirezhr",       false, false, true,  false, false);
            html += thanksLineBuild("king-ton",             "",                false, false, true,  false, false);
            html += thanksLineBuild("dontpänic",            "haarspalter",     false, false, true,  false, false);
            html += thanksLineBuild("Bananeweizen",         "",                false, false, true,  false, true);
            // Bug Reporting alphabetisch.
            html += thanksLineBuild("arbor95",              "",                false, false, false, true,  false);
            html += thanksLineBuild("barnold",              "barnoldGEOC",     false, false, false, true,  false);
            html += thanksLineBuild("BlueEagle23",          "",                false, false, false, true,  false);
            html += thanksLineBuild("Cappa-d",              "",                false, false, false, true,  false);
            html += thanksLineBuild("",                     "gboye",           false, false, false, true,  false);
            html += thanksLineBuild("Die Batzen",           "DieBatzen",       false, false, false, true,  false);
            html += thanksLineBuild("Donnerknispel",        "",                false, false, false, true,  false);
            html += thanksLineBuild("Jipem",                "",                false, false, false, true,  false);
            html += thanksLineBuild("Magpie42",             "MagpieFourtyTwo", false, false, false, true,  false);
            html += thanksLineBuild("☺Mitchsa & firefly70", "Mitchsa",         false, false, false, true,  false);
            html += thanksLineBuild("Pontiac_CZ",           "PontiacCZ",       false, false, false, true,  false);
            html += thanksLineBuild("RoRo",                 "RolandRosenfeld", false, false, false, true,  false);
            html += thanksLineBuild("stepborc",             "",                false, false, false, true,  false);
            html += thanksLineBuild("V60",                  "V60GC",           false, false, false, true,  false);
            html += thanksLineBuild("winkamol",             "",                false, false, false, true,  false);
            var thanksLastUpdate = "13.12.2019";
//<-- $$006
            html += "    </tbody>";
            html += "</table>";
            html += "<span style='float: right; font-size: 10px;'>Last update: " + thanksLastUpdate + " </span>";
            html += "<div class='gclh_thanks_area_button'>";
            html += "<br><input class='gclh_thanks_form' type='button' value='close' id='thanks_close_button'>";
            html += "</div></div></div>";

            html += "<div id='gclh_config_content3'>";
            html += "<br>";
            html += "<h4 class='gclh_headline2'>"+prepareHideable.replace("#name#","global")+"Global</h4>";
            html += "<div id='gclh_config_global' class='gclh_block'>";
            html += "<label for='settings_home_lat_lng'>&nbsp;Home coords: </label><input class='gclh_form' type='text' size='27' id='settings_home_lat_lng' value='" + DectoDeg(getValue("home_lat"), getValue("home_lng")) + "'>" + show_help("The home coords are filled automatically if you update your home coords on GC page. If it doesn\'t work you can insert them here. These coords are used for some special links (nearest list, nearest map, ...) and for the main Homezone circle on the map.") + "<br>";
            html += checkboxy('settings_set_default_langu', 'Set default language ');
            html += "<select class='gclh_form' id='settings_default_langu'>";
            for (var i = 0; i < langus.length; i++) {
                html += "  <option value='" + langus[i] + "' " + (settings_default_langu == langus[i] ? "selected='selected'" : "") + "> " + langus[i] + "</option>";
            }
            html += "</select>" + show_help("Here you can change the default language to set on GC pages, in the case, apps changed the language.<br><br>In distant, very very distant future is planned to make the GClh multilingual. Until that is realized, the GClh is only in english.") + "<br>";
            html += checkboxy('settings_change_header_layout', "Change header layout") + show_help("This option redesines the header layout on GC pages to save some vertical space.") + "<br>";
            html += " &nbsp; " + checkboxy('settings_show_smaller_gc_link', 'Show smaller GC logo top left') + show_help("With this option you can choose a smaller display of the GC logo top left on GC pages.<br><br>" + t_reqChl) + "<br>";
            html += " &nbsp; &nbsp; " + checkboxy('settings_remove_logo', 'Remove GC logo top left') + show_help_big("With this option you can remove the GC logo top left on GC pages.<br><br>This feature is not fully integrated in the diverse possibilities of the header layout and the navigation menus.<br><br>This option require \"Change header layout\" and \"Show smaller GC logo top left\".") + "<br>";
            html += " &nbsp; " + checkboxy('settings_remove_message_in_header', 'Remove message center icon top right') + show_help_big("With this option you can remove the message center icon top right on GC pages. You will not be informed longer about new messages.<br><br>" + t_reqChl) + "<br>";
            html += " &nbsp; " + checkboxy('settings_gc_tour_is_working', 'Reserve a place for GC Tour icon') + show_help("If the script GC Tour is running, you can reserve a place top left on GC pages for the GC Tour icon.<br><br>" + t_reqChl) + "<br>";
            html += " &nbsp; " + checkboxy('settings_fixed_header_layout', 'Arrange header layout on content') + show_help_big("With this option you can arrange the header width on the width of the content of GC pages. This is an easy feature with some restrictions, like for example the available place, especially for horizontal navigation menues.<br><br>This feature is available on GC pages in the oldest design like for example cache and TB listings, bookmarks, pocket queries, nearest lists, old dashboards (profiles), statistics, watchlists and drafts, to name just a few. <br><br>On map page and on pages in the newer and newest design it is not available, partly because the content on these pages are not yet in an accurate width, like the newer search cache page or the message center page. Also this feature is not fully integrated in the diverse possibilities of the header layout and the navigation menus. But we hope the friends of this specific header design can deal with it.<br><br>" + t_reqChl) + "<br>";
            html += checkboxy('settings_bookmarks_on_top', "Show <a class='gclh_ref' href='#gclh_linklist' title='Link to topic \"Linklist / Navigation\"' id='gclh_linklist_link_1'>Linklist</a> on top") + show_help_big("Show the Linklist on the top of GC pages, beside the other links. You can configure the links in the Linklist at the end of this configuration page.<br><br>Some of the features of the Linklist on top, like for example the font size or the distance between drop-down links, requires \"Change header layout\". Details you can see at the end of this configuration page by the features of the Linklist.") + "<br>";
            html += checkboxy('settings_hide_advert_link', 'Hide link to advertisement instructions') + "<br>";
            html += "&nbsp;" + "Page width: <input class='gclh_form' type='text' size='4' id='settings_new_width' value='" + getValue("settings_new_width", 1000) + "'> px" + show_help("With this option you can expand the small layout on GC pages. The default value on GC pages is 950 pixel.") + "<br>";
            html += checkboxy('settings_hide_facebook', 'Hide Facebook login') + "<br>";
            html += checkboxy('settings_hide_socialshare', 'Hide social sharing Facebook and Twitter') + "<br>";
            html += newParameterOn3;
            html += checkboxy('settings_hide_feedback_icon', 'Hide green feedback icon') + "<br>";
            html += newParameterVersionSetzen(0.9) + newParameterOff;
            html += checkboxy('settings_hide_warning_message', 'Hide warning message') + show_help_big("With this option you can choose the possibility to hide a potential warning message of the masters of the GC pages.<br><br>One example is the down time warning message which comes from time to time and is placed unnecessarily a lot of days at the top of pages. You can hide it except for a small line in the top right side of the pages. You can activate the warning message again if your mouse goes to this area.<br><br>If the warning message is deleted of the masters, this small area is deleted too.") + "<br>";
            html += newParameterOn2;
            html += checkboxy('settings_remove_banner', 'Remove banner') + "<br>";
            html += " &nbsp; " + checkboxy('settings_remove_banner_for_garminexpress', 'for \"Garmin Express\"') + "<br>";
            html += " &nbsp; " + checkboxy('settings_remove_banner_blue', 'Try to remove all blue banner to new designed pages') + "<br>";
            html += newParameterVersionSetzen(0.8) + newParameterOff;
            html += "<table style='width: 550px; text-align: left; margin-top: 9px;'>";
            html += "  <thead>";
            html += "    <tr><th><span>Show lines in</span></th>";
            html += "      <th><span>lists </span>" + show_help("Lists are all common lists but not the TB listing and not the cache listing.") + "</th>";
            html += "      <th><span>cache listings</span>" + show_help(t_reqLlwG) + "</th>";
            html += "      <th><span>TB listings</span></th>";
            html += "      <th><span>in color</span></th></tr>";
            html += "  </thead>";
            html += "  <tbody>";
            html += "    <tr><td><span>for zebra:</span>" + show_help2("With this options you can color every second line in the specified lists in the specified \"alternating\" color.") + "</td>";
            html += "      <td><input type='checkbox'" + (getValue('settings_show_common_lists_in_zebra') ? "checked='checked'" : "" ) + " id='settings_show_common_lists_in_zebra'></td>";
            html += "      <td><input type='checkbox'" + (getValue('settings_show_cache_listings_in_zebra') ? "checked='checked'" : "" ) + " id='settings_show_cache_listings_in_zebra'></td>";
            html += "      <td><input type='checkbox'" + (getValue('settings_show_tb_listings_in_zebra') ? "checked='checked'" : "" ) + " id='settings_show_tb_listings_in_zebra'></td>";
            html += "      <td><input class='gclh_form color' type='text' size=6 id='settings_lines_color_zebra' value='" + getValue("settings_lines_color_zebra", "EBECED") + "'><img src=" + global_restore_icon + " id='restore_settings_lines_color_zebra' title='back to default' style='width: 12px; cursor: pointer;'></td></tr>";
            html += "    <tr><td><span>for you:</span>" + show_help2("With this options you can color your logs respectively your founds in the specified lists in the specified color.") + "</td>";
            html += "      <td><input type='checkbox'" + (getValue('settings_show_common_lists_color_user') ? "checked='checked'" : "" ) + " id='settings_show_common_lists_color_user'></td>";
            html += "      <td><input type='checkbox'" + (getValue('settings_show_cache_listings_color_user') ? "checked='checked'" : "" ) + " id='settings_show_cache_listings_color_user'></td>";
            html += "      <td><input type='checkbox'" + (getValue('settings_show_tb_listings_color_user') ? "checked='checked'" : "" ) + " id='settings_show_tb_listings_color_user'></td>";
            html += "      <td><input class='gclh_form color' type='text' size=6 id='settings_lines_color_user' value='" + getValue("settings_lines_color_user", "C2E0C3") + "'><img src=" + global_restore_icon + " id='restore_settings_lines_color_user' title='back to default' style='width: 12px; cursor: pointer;'></td></tr>";
            html += "    <tr><td><span>for owners:</span></td><td></td>";
            html += "      <td><input type='checkbox'" + (getValue('settings_show_cache_listings_color_owner') ? "checked='checked'" : "" ) + " id='settings_show_cache_listings_color_owner'></td>";
            html += "      <td><input type='checkbox'" + (getValue('settings_show_tb_listings_color_owner') ? "checked='checked'" : "" ) + " id='settings_show_tb_listings_color_owner'></td>";
            html += "      <td><input class='gclh_form color' type='text' size=6 id='settings_lines_color_owner' value='" + getValue("settings_lines_color_owner", "E0E0C3") + "'><img src=" + global_restore_icon + " id='restore_settings_lines_color_owner' title='back to default' style='width: 12px; cursor: pointer;'></td></tr>";
            html += "    <tr><td><span>for reviewers:</span></td><td></td>";
            html += "      <td><input type='checkbox'" + (getValue('settings_show_cache_listings_color_reviewer') ? "checked='checked'" : "" ) + " id='settings_show_cache_listings_color_reviewer'></td>";
            html += "      <td><input type='checkbox'" + (getValue('settings_show_tb_listings_color_reviewer') ? "checked='checked'" : "" ) + " id='settings_show_tb_listings_color_reviewer'></td>";
            html += "      <td><input class='gclh_form color' type='text' size=6 id='settings_lines_color_reviewer' value='" + getValue("settings_lines_color_reviewer", "EAD0C3") + "'><img src=" + global_restore_icon + " id='restore_settings_lines_color_reviewer' title='back to default' style='width: 12px; cursor: pointer;'></td></tr>";
            html += "    <tr><td><span>for VIPs:</span></td><td></td>";
            html += "      <td><input type='checkbox'" + (getValue('settings_show_cache_listings_color_vip') ? "checked='checked'" : "" ) + " id='settings_show_cache_listings_color_vip'></td>";
            html += "      <td><input type='checkbox'" + (getValue('settings_show_tb_listings_color_vip') ? "checked='checked'" : "" ) + " id='settings_show_tb_listings_color_vip'></td>";
            html += "      <td><input class='gclh_form color' type='text' size=6 id='settings_lines_color_vip' value='" + getValue("settings_lines_color_vip", "F0F0A0") + "'><img src=" + global_restore_icon + " id='restore_settings_lines_color_vip' title='back to default' style='width: 12px; cursor: pointer;'></td></tr>";
            html += "  </tbody>";
            html += "</table>";
            html += "</div>";

            html += "<h4 class='gclh_headline2' title='this page'>"+prepareHideable.replace("#name#","config")+"GClh Config / Sync</h4>";
            html += "<div id='gclh_config_config' class='gclh_block'>";
            html += checkboxy('settings_f4_call_gclh_config', 'Call GClh Config on F4') + show_help("With this option you are able to call the GClh Config page (this page) by pressing key F4 from all GC pages.") + "<br>";
            html += checkboxy('settings_f2_save_gclh_config', 'Save GClh Config on F2') + show_help("With this option you are able to save the GClh Config page (this page) by pressing key F2 instead of scrolling to the bottom and choose the save button.") + "<br>";
            html += newParameterOn2;
            html += checkboxy('settings_esc_close_gclh_config', 'Close GClh Config on ESC') + show_help("With this option you are able to close the GClh Config page (this page) by pressing ESC.") + "<br>";
            html += newParameterVersionSetzen(0.8) + newParameterOff;
            html += checkboxy('settings_f10_call_gclh_sync', 'Call GClh Sync on F10') + show_help("With this option you are able to call the GClh Sync page by pressing key F10.") + "<br>";
            html += checkboxy('settings_sync_autoImport', 'Auto apply DB Sync') + show_help("If you enable this option, settings from DropBox will be applied automatically about GClh Sync every 10 hours.") + "<br>";
            html += checkboxy('settings_show_save_message', 'Show info message if GClh data are saved') + show_help("With this option an info message is displayed if the GClh Config data are saved respectively if the GClh Sync data are imported.") + "<br>";
            html += checkboxy('settings_sort_default_bookmarks', 'Sort default links for the Linklist') + show_help("With this option you can sort the default links for the Linklist by description. You can configure these default links to use in your Linklist at the end of this configuration page.<br><br>A change at this option evolute its effect only after a save.") + "<br>";
            html += checkboxy('settings_hide_colored_versions', 'Hide colored illustration of versions') + show_help("With this option the colored illustration of the versions and the version numbers in GClh Config (this page) are selectable.<br><br>A change at this option evolute its effect only after a save.") + "<br>";
            html += checkboxy('settings_make_config_main_areas_hideable', 'Make main areas in GClh Config hideable') + show_help("With this option you can hide and show the main areas in GClh Config (this page) with a left mouse click. With a right mouse click you can hide and show all the main areas in GClh Config together.<br><br>A change at this option evolute its effect only after a save.") + "<br>";
            html += "</div>";

            html += "<h4 class='gclh_headline2'>"+prepareHideable.replace("#name#","nearestlist")+"Nearest list</h4>";
            html += "<div id='gclh_config_nearestlist' class='gclh_block'>";
            html += checkboxy('settings_redirect_to_map', 'Redirect cache search lists to map display') + show_help("If you enable this option, you will be automatically redirected from the older cache search lists (nearest lists) to map display. This is only possible in search lists with a link to the map display.<br><br>Please note that a display of the search list is no longer possible, because it is always redirected to the map display.") + "<br>";
            html += checkboxy('settings_show_nearestuser_profil_link', 'Show profile link at search lists for caches created or found by') + show_help("This option adds an link to the public user profile when searching for caches created or found by a certain user.") + "<br>";
            var content_settings_show_log_it = checkboxy('settings_show_log_it', 'Show GClh \"Log it\" icon on nearest lists, PQs, recently viewed caches list') + show_help3("The GClh \"Log it\" icon is displayed beside cache titles in nearest lists, pocket queries and the recently viewed caches list. If you click it, you will be redirected directly to the log form. <br><br>You can use it too as basic member to log Premium Member Only (PMO) caches.") + "<br>";
            html += content_settings_show_log_it;
            html += newParameterOn2;
            html += checkboxy('settings_compact_layout_nearest', 'Show compact layout in all nearest lists (without PQ)') + show_help("For pocket queries, please go to the section \"Pocket query\", there is a special parameter for pocket queries.") + "<br>";
            html += newParameterVersionSetzen(0.8) + newParameterOff;
            html += newParameterOn3;
            html += " &nbsp; " + checkboxy('settings_fav_proz_nearest', 'Show favorites percentage') + "<br>";
            html += newParameterVersionSetzen(0.9) + newParameterOff;
            html += "</div>";

            html += "<h4 class='gclh_headline2'>"+prepareHideable.replace("#name#","pq")+"Pocket query" + prem + "</h4>";
            html += "<div id='gclh_config_pq' class='gclh_block'>";
            html += checkboxy('settings_fixed_pq_header', 'Show fixed header/footer in list of pocket queries') + show_help("Convenient for large PQ lists. With this option, you get a permanent view of the headers (weekday information) and footer (the number of running / remaining PQs) even if it is your list the larger as your monitor.") + "<br>"
            html += content_settings_show_log_it.replace("show_log_it","show_log_itX0");
            var content_settings_submit_log_button = checkboxy('settings_submit_log_button', 'Submit log, pocket query, bookmark or hide cache on F2') + show_help("With this option you are able to submit your log by pressing key F2 instead of scrolling to the bottom and move the mouse to the button. <br><br>This feature also works to submit pocket queries and bookmarks. <br><br>And it works on the whole hide cache process with all of the buttons of the create and the change functionality. <br><br>It works also to save Personal Cache Notes in cache listings.") + "<br>";
            html += content_settings_submit_log_button;
            html += newParameterOn2;
            html += checkboxy('settings_compact_layout_list_of_pqs', 'Show compact layout in list of pocket queries') + "<br>";
            html += newParameterVersionSetzen(0.8) + newParameterOff;
            html += newParameterOn3;
            html += " &nbsp; " + checkboxy('settings_both_tabs_list_of_pqs_one_page', 'Show both tabs in list of pocket queries of one page') + show_help("Show the both tabs \"Active Pocket Queries\" and \"Pocket Queries Ready for Download\" together of one page.") + "<br>";
            html += newParameterVersionSetzen(0.9) + newParameterOff;
            html += newParameterOn2;
            html += checkboxy('settings_compact_layout_pqs', 'Show compact layout in pocket queries') + "<br>";
            html += newParameterVersionSetzen(0.8) + newParameterOff;
            html += newParameterOn3;
            html += " &nbsp; " + checkboxy('settings_fav_proz_pqs', 'Show favorites percentage') + "<br>";
            html += newParameterVersionSetzen(0.9) + newParameterOff;
            html += checkboxy('settings_pq_warning', "Get a warning in case of empty pocket queries") + show_help("Show a message if one or more options are in conflict. This helps to avoid empty pocket queries.") + "<br>";
            html += newParameterOn3;
            html += checkboxy('settings_pq_previewmap','Show preview map for origin by coordinates') + "&nbsp;";
            html += '<select class="gclh_form" id="settings_pq_previewmap_layer" style="width: 210px;">';
            for ( name in all_map_layers) {
                html += "  <option value='" + name + "' " + (settings_pq_previewmap_layer == name ? "selected='selected'" : "") + "> " + name + "</option>";
            }
            html += '</select>'+ "<br>";
            html += newParameterVersionSetzen(0.9) + newParameterOff;

            html += "<div style='margin-top: 9px; margin-left: 5px'><b>Default values for new pocket query</b></div>";
            html += checkboxy('settings_pq_set_cachestotal', "Set number of caches to ") + "<input class='gclh_form' size=4 type='text' id='settings_pq_cachestotal' value='" + settings_pq_cachestotal + "'><br>";
            html += checkboxy('settings_pq_option_ihaventfound', "Enable option \"I haven't found\"") + "<br>";
            html += checkboxy('settings_pq_option_idontown', "Enable option \"I don't own\"") + "<br>";
            html += checkboxy('settings_pq_option_ignorelist', "Enable option \"Are not on my ignore list\"") + "<br>";
            html += checkboxy('settings_pq_option_isenabled', "Enable option \"Is Enabled\"") + "<br>";
            html += checkboxy('settings_pq_option_filename', "Enable option \"Include pocket query name in download file name\"") + "<br>";
            html += checkboxy('settings_pq_set_difficulty', "Set difficulity ") + gclh_createSelectOptionCode("settings_pq_difficulty", dt_display, settings_pq_difficulty) + '&nbsp;' + gclh_createSelectOptionCode("settings_pq_difficulty_score", dt_score, settings_pq_difficulty_score) + "<br>";
            html += checkboxy('settings_pq_set_terrain', "Set terrain ") + gclh_createSelectOptionCode("settings_pq_terrain", dt_display, settings_pq_terrain) + '&nbsp;' + gclh_createSelectOptionCode("settings_pq_terrain_score", dt_score, settings_pq_terrain_score) + "<br>";
            html += checkboxy('settings_pq_automatically_day', "Generate pocket query today") + show_help("Use the server time to set the week day for creation.") + "<br>";
            html += "</div>";

            html += "<h4 class='gclh_headline2'>"+prepareHideable.replace("#name#","recview")+"Recently viewed caches list" + "</h4>";
            html += "<div id='gclh_config_recview' class='gclh_block'>";
            html += newParameterOn3;
            html += content_settings_show_log_it.replace("show_log_it","show_log_itX1");
            html += checkboxy('settings_compact_layout_recviewed', 'Show compact layout in your recently viewed caches list') + "<br>";
            html += " &nbsp; " + checkboxy('settings_fav_proz_recviewed', 'Show favorites percentage') + "<br>";
            html += newParameterVersionSetzen(0.9) + newParameterOff;
            html += "</div>";

            html += "<h4 class='gclh_headline2'>"+prepareHideable.replace("#name#","bm")+"Bookmark list" + prem + "</h4>";
            html += "<div id='gclh_config_bm' class='gclh_block'>";

            html += "<div class='gclh_old_new_line'>New bookmark lists, favorites list, ignore list only</div>";
            html += newParameterOn1;
            html += checkboxy('settings_lists_compact_layout', 'Show compact layout') + show_help("With this option the list of bookmark lists, the bookmark lists, the favorites list and the ignore list is displayed in compact layout.") + "<br>";
            var content_status_line = "If the name of disabled and archived caches are specially represented and the identifier of premium member only caches are shown in an own column, the cache status line above the cache name is hidden.";
            html += checkboxy('settings_lists_disabled', 'Show name of disabled caches ') + checkboxy('settings_lists_disabled_strikethrough', 'strike through in color ');
            html += "<input class='gclh_form color' type='text' size=6 id='settings_lists_disabled_color' style='margin-left: 0px;' value='" + getValue("settings_lists_disabled_color", "4A4A4A") + "'>";
            html += "<img src=" + global_restore_icon + " id='restore_settings_lists_disabled_color' title='back to default' style='width: 12px; cursor: pointer;'>" + show_help3(content_status_line) + "<br>";
            html += checkboxy('settings_lists_archived', 'Show name of archived caches ') + checkboxy('settings_lists_archived_strikethrough', 'strike through in color ');
            html += "<input class='gclh_form color' type='text' size=6 id='settings_lists_archived_color' style='margin-left: 0px;' value='" + getValue("settings_lists_archived_color", "8C0B0B") + "'>";
            html += "<img src=" + global_restore_icon + " id='restore_settings_lists_archived_color' title='back to default' style='width: 12px; cursor: pointer;'>" + show_help3(content_status_line) + "<br>";
            html += checkboxy('settings_lists_icons_visible', 'Set visibility of cache type icons and log status icons') + show_help("The cache type icon and the log status icon are sometimes slightly invisible and sometimes visible, if the cache is disabled or archived. With this and the following options, you can set it consistently, if the cache is disabled or archived.") + "<br>";
            html += " &nbsp; " + checkboxy('settings_lists_cache_type_icons_visible', 'Set cache type icon visible, if cache is disabled or archived') + "<br>";
            html += " &nbsp; " + checkboxy('settings_lists_log_status_icons_visible', 'Set log status icon visible, if cache is disabled or archived') + "<br>";
            html += checkboxy('settings_lists_premium_column', 'Set identifier of premium member only caches in own column') + show_help(content_status_line) + "<br>";
            html += checkboxy('settings_lists_found_column_bml', 'Set found smiley in own column') + show_help("Only in bookmark lists, not in favorites list and ignore list.") + "<br>";
            html += checkboxy('settings_lists_show_log_it', 'Show GClh \"Log it\" icon') + show_help("Only in bookmark lists, not in favorites list and ignore list.<br><br>The GClh \"Log it\" icon is displayed beside cache titles. If you click it, you will be redirected directly to the log form. <br><br>You can use it too as basic member to log Premium Member Only (PMO) caches.") + "<br>";
            html += checkboxy('settings_lists_back_to_top', 'Hide \"Back to top\" icon') + "<br>";
            html += newParameterVersionSetzen("0.10") + newParameterOff;

            html += "<div class='gclh_old_new_line'>Old bookmark lists only</div>";
            html += checkboxy('settings_show_sums_in_bookmark_lists', 'Show number of caches in bookmark lists') + show_help("With this option the number of caches and the number of selected caches in the categories \"All\", \"Found\", \"Archived\" and \"Deactivated\", corresponding to the select buttons, are shown in bookmark lists at the end of the list.") + "<br>";
            html += content_settings_submit_log_button.replace("log_button","log_buttonX0");
            html += newParameterOn3;
            html += checkboxy('settings_bm_changed_and_go', 'After change of bookmark go to bookmark list automatically') + show_help3("With this option you can switch to the bookmark list automatically after a change of a bookmark. The confirmation page of this change will skip.") + "<br>";
            html += checkboxy('settings_bml_changed_and_go', 'After change of bookmark list go to bookmark list automatically') + show_help3("With this option you can switch to the bookmark list automatically after a change of the bookmark list. The confirmation page of this change will skip.") + "<br>";
            html += newParameterVersionSetzen(0.9) + newParameterOff;
            html += "</div>";

            html += "<h4 class='gclh_headline2'>"+prepareHideable.replace("#name#","friends")+"Friends list" + "</h4>";
            html += "<div id='gclh_config_friends' class='gclh_block'>";
            html += checkboxy('settings_automatic_friend_reset', 'Reset difference counter on friends list automatically') + show_help("If you enable this option, the difference counter at friends list will automatically reset if you have seen the difference and if the day changed.") + "<br>";
            html += checkboxy('settings_friendlist_summary', 'Show summary for new finds/hides in friends list') + show_help("With this option you can show a summary of all new finds/hides of your friends on the friends list page") + "<br>";
            html += " &nbsp; " + checkboxy('settings_friendlist_summary_viponly', 'Show summary only for friends in VIP list') + "<br>";
            html += checkboxy('settings_show_vup_friends', 'Show VUP icons on friends list') + show_help_big("With this option you can choose if VUP icons are shown addional on friends list or not. If you deactivate this option and a friend is a VUP, then the VIP icon is replaced by the VUP icon anyway.<br>(VUP: Very unimportant person)<br>(VIP: Very important person)<br><br>This option requires \"Process VUPs\" and \"Show VIP list\".") + "<br>";
            html += "</div>";

            html += "<h4 class='gclh_headline2'>"+prepareHideable.replace("#name#","hide")+"Hide cache" + "</h4>";
            html += "<div id='gclh_config_hide' class='gclh_block'>";
            html += checkboxy('settings_hide_cache_approvals', 'Auto set approval in hide cache process') + show_help("This option activates the checkbox for approval the \"terms of use agreement\" and the \"geocache hiding guidelines\" in the hide cache process.") + "<br>";
            html += content_settings_submit_log_button.replace("log_button","log_buttonX1");
            html += "</div>";

            html += "<h4 class='gclh_headline2'>"+prepareHideable.replace("#name#","others")+"Others" + "</h4>";
            html += "<div id='gclh_config_others' class='gclh_block'>";
            html += checkboxy('settings_search_enable_user_defined', 'Enable user defined filter sets for geocache searchs') + show_help("This features enables you to store favourites filter settings in the geocache search and call them quickly.") + prem + "<br>";
            html += checkboxy('settings_show_sums_in_watchlist', 'Show number of caches in your watchlist') + show_help("With this option the number of caches and the number of selected caches in the categories \"All\", \"Archived\" and \"Deactivated\", corresponding to the select buttons, are shown in your watchlist at the end of the list.") + "<br>";
            html += checkboxy('settings_hide_archived_in_owned', 'Hide archived caches in owned list') + "<br>";
            html += newParameterOn3;
            html += checkboxy('settings_modify_new_drafts_page', 'Modify draft items on the new drafts page') + show_help("Change the linkage of each draft. The title of the geocache now links to the geocaching listing and the cache icon, too (2nd line). The pen icon and the preview note links to the log composing page (3rd line). Add the log type as overlay icon onto the cache icon.") + "<br>";
            html += newParameterVersionSetzen(0.9) + newParameterOff;
            html += newParameterOn1;
            html += checkboxy('settings_compactLayout_unpublishedList', 'Show compact layout for unpublished caches') + "<br>";
            html += checkboxy('settings_set_compactLayoutUnpublishedHides_sort', 'Sort unpublished caches') + " ";
            html += "<select class='gclh_form' id='settings_compactLayoutUnpublishedHides_sort'>";
            html += "  <option value='abc' " + (settings_compactLayoutUnpublishedHides_sort == 'abc' ? "selected='selected'" : "") + "> Alphabetical</option>";
            html += "  <option value='gcOld' " + (settings_compactLayoutUnpublishedHides_sort == 'gcOld' ? "selected='selected'" : "") + "> GC-Code (oldest first)</option>";
            html += "  <option value='gcNew' " + (settings_compactLayoutUnpublishedHides_sort == 'gcNew' ? "selected='selected'" : "") + "> GC-Code (newest first)</option>";
            html += "</select><br>";
            html += newParameterVersionSetzen("0.10") + newParameterOff;
            html += "</div>";

            html += "<h4 class='gclh_headline2'>"+prepareHideable.replace("#name#","maps")+"Map</h4>";
            html += "<div id='gclh_config_maps' class='gclh_block'>";
            html += "<div style='margin-left: 5px'><b>Homezone circles</b></div>";
            html += checkboxy('settings_show_homezone', 'Show Homezone circles') + show_help("This option allows to draw Homezone circles around coordinates on the map.") + "<br>";
            html += "<div id='ShowHomezoneCircles' style='display: " + (settings_show_homezone ? "block":"none") + ";'>";
            html += "<table class='multi_homezone_settings'>";
            html += "  <thead><tr>";
            html += "      <th><span>Radius</span></th>";
            html += "      <th><span>Color</span>" + show_help("Default color is \"0000FF\".") + "</th>";
            html += "      <th><span>Opacity</span>" + show_help("Higher number is darker.<br>Default opacity is \"10\".") + "</th>";
            html += "      <th><span>Coordinates</span></th>";
            html += "      <th><span></span></th>";
            html += "  </tr></thead>";
            html += "  <tbody>";
            // Template.
            var hztp = "<tr class='multi_homezone_element'>";
            hztp += "      <td><input class='gclh_form radius' type='text' size='2' value='" + settings_homezone_radius + "'><span> km</span></td>";
            hztp += "      <td><input class='gclh_form color' type='text' size='6' value='" + settings_homezone_color + "'></td>";
            hztp += "      <td><input class='gclh_form opacity' type='text' size='2' value='" + settings_homezone_opacity + "'><span> %</span></td>";
            hztp += "      <td><input class='gclh_form coords' type='text' size='27' value='" + DectoDeg(getValue("home_lat"), getValue("home_lng")) + "'></td>";
            hztp += "      <td><img title ='Delete Homezone circle' class='remove' src='" + global_del_it_icon + "'/></td></tr>";
            // Homezone circle.
            var newHzEl = $('<tr>').append($(hztp));
            newHzEl.find('tr').attr('class', 'homezone_element');
            newHzEl.find('.radius').attr('id', 'settings_homezone_radius');
            newHzEl.find('.color').attr('id', 'settings_homezone_color');
            newHzEl.find('.opacity').attr('id', 'settings_homezone_opacity');
            newHzEl.find('.coords').attr('disabled', '');
            newHzEl.find('.coords').attr('class', 'gclh_form coords disabled');
            newHzEl.find('.remove').attr('title', '');
            newHzEl.find('.remove').attr('disabled', '');
            newHzEl.find('.remove').attr('class', 'remove disabled');
            html += newHzEl.html();
            // Multi Homezone circles.
            for (var i in settings_multi_homezone) {
                var hzel = settings_multi_homezone[i];
                var newHzEl = $('<tr>').append($(hztp));
                newHzEl.find('.radius').attr('value', hzel.radius);
                newHzEl.find('.color').attr('value', hzel.color);
                newHzEl.find('.opacity').attr('value', hzel.opacity);
                newHzEl.find('.coords').attr('value', DectoDeg(hzel.lat, hzel.lng));
                html += newHzEl.html();
            }
            html += "  </tbody>";
            html += "  <tfoot><tr><td colspan='5'><button type='button' class='gclh_form addentry' title='Create further Homezone circle'>create</button></td></tr></tfoot>";
            html += "</table></div>";

            html += "<div style='margin-top: 9px; margin-left: 5px'><b>Hide map elements</b></div>";
            html += checkboxy('settings_map_hide_sidebar', 'Hide sidebar by default') + "<br>";
            html += checkboxy('settings_hide_map_header', 'Hide header by default') + "<br>";
            html += checkboxy('settings_map_hide_found', 'Hide found caches by default') + prem + "<br>";
            html += checkboxy('settings_map_hide_hidden', 'Hide own caches by default') + prem + "<br>";
            html += newParameterOn1;
            html += checkboxy('settings_map_hide_dnfs', 'Hide DNF smileys by default') + prem + "<br>";
            html += newParameterVersionSetzen('0.10') + newParameterOff;
            html += "&nbsp;" + "Hide cache types by default: " + prem + "<br>";

            var imgStyle = "style='padding-top: 4px; vertical-align: bottom;'";
            var imageBaseUrl = "/map/images/mapicons/";
            html += " &nbsp; " + checkboxy('settings_map_hide_2', "<img "+imgStyle+" src='" + imageBaseUrl + "2.png' title='Traditional'>") + "<br>";
            html += " &nbsp; " + checkboxy('settings_map_hide_3', "<img "+imgStyle+" src='"  + imageBaseUrl + "3.png' title='Multi-Cache'>") + "<br>";
            html += " &nbsp; " + checkboxy('settings_map_hide_6', "<img "+imgStyle+" src='" + imageBaseUrl + "6.png' title='Event'>");
            html += " &nbsp; " + checkboxy('settings_map_hide_13', "<img "+imgStyle+" src='" + imageBaseUrl + "13.png' title='Cache In Trash Out'>");
            html += " &nbsp; " + checkboxy('settings_map_hide_453', "<img "+imgStyle+" src='" + imageBaseUrl + "453.png' title='Mega-Event'>");
            html += " &nbsp; " + checkboxy('settings_map_hide_7005', "<img "+imgStyle+" src='" + imageBaseUrl + "7005.png' title='Giga-Event'>") + "<br>";
            html += " &nbsp; " + checkboxy('settings_map_hide_137', "<img "+imgStyle+" src='" + imageBaseUrl + "137.png' title='EarthCache'>");
            html += " &nbsp; " + checkboxy('settings_map_hide_4', "<img "+imgStyle+" src='" + imageBaseUrl + "4.png' title='Virtual'>");
            html += " &nbsp; " + checkboxy('settings_map_hide_11', "<img "+imgStyle+" src='" + imageBaseUrl + "11.png' title='Webcam'>") + "<br>";
            html += " &nbsp; " + checkboxy('settings_map_hide_8', "<img "+imgStyle+" src='" + imageBaseUrl + "8.png' title='Mystery'>");
            html += " &nbsp; " + checkboxy('settings_map_hide_5', "<img "+imgStyle+" src='" + imageBaseUrl + "5.png' title='Letterbox'>");
            html += " &nbsp; " + checkboxy('settings_map_hide_1858', "<img "+imgStyle+" src='" + imageBaseUrl + "1858.png' title='Wherigo'>") + "<br>";

            html += "<div style='margin-top: 9px; margin-left: 5px'><b>Layers in map</b>" + show_help("Here you can select the map layers which should be added into the layer menu with the map. With this option you can reduce the long list to the layers you really need. If the right list of layers is empty, all will be displayed. If you use other scripts like \"Geocaching Map Enhancements\" GClh will overwrite its layercontrol. With this option you can disable GClh layers to use the layers for example from GC or GME.") + "</div>";
            html += checkboxy('settings_use_gclh_layercontrol', 'Replace layers by GClh') + show_help_big("GClh will replace the layers. With this option you can disable this replacement to use the layers from GC or other scripts like GME (Geocaching Map Enhancements). But you can use too the layers of GClh together with the functionality of GME.<br><br>It is important, that GClh run at first, particularly in front of other layer used scripts like GME or GCVote.<br><br>If there are problems with the layers by using GCVote at once, you have to clear the local storage of GCVote. You can do it about your dashboard. If that does not help, deinstall and install GCVote again. (GCVote use a local storage for its data. This storage can include incomplete layers which influence the layer control.)") + "<br>";
            html += "<div id='MapLayersConfiguration' style='display: " + (settings_use_gclh_layercontrol ? "block":"none") + ";'>";
            html += "<table cellspacing='0' cellpadding='0' border='0'><tbody>";
            html += "<tr>";
            html += "<td><select class='gclh_form' style='width: 255px;' id='settings_maplayers_unavailable' multiple='single' size='7'></select></td>";
            html += "<td><input style='padding-left: 2px; padding-right: 2px; cursor: pointer;' class='gclh_form' type='button' value='>' id='btn_map_layer_right'><br><br><input style='padding-left: 2px; padding-right: 2px; cursor: pointer;' class='gclh_form' type='button' value='<' id='btn_map_layer_left'></td>";
            html += "<td><select class='gclh_form' style='width: 255px;' id='settings_maplayers_available' multiple='single' size='7'></select></td>";
            html += "</tr>";
            html += "<tr><td colspan='3'>Default layer: <code><span id='settings_mapdefault_layer'>" + (settings_map_default_layer ? settings_map_default_layer:"<i>not available</i>") +"</span></code>";
            html += "&nbsp;" + show_help("Here you can select the map source you want to use as default in the map. Mark a layer from the right list and push the button \"Set default layer\".");
            html += "<span style='float: right; margin-top: 0px;' ><input class='gclh_form' type='button' value='Set default layer' id='btn_set_default_layer'></span><br><span style='margin-left: -4px'></span>";
            html += checkboxy('settings_show_hillshadow', 'Show Hillshadow by default') + show_help("If you want 3D-like-Shadow to be displayed by default, activate this function.") + "<br>";
            html += "</td></tr>";
            html += "</tbody></table></div>";
            html += "<div style='margin-top: 9px; margin-left: 5px'><b>Google Maps page</b></div>";
            html += checkboxy('settings_hide_left_sidebar_on_google_maps', 'Hide left sidebar on Google Maps by default') + "<br>";
            html += checkboxy('settings_add_link_gc_map_on_google_maps', 'Add link to GC Map on Google Maps') + show_help("With this option an icon are placed on the Google Maps page to link to the same area in GC Map.") + "<br>";
            html += " &nbsp; " + checkboxy('settings_switch_to_gc_map_in_same_tab', 'Switch to GC Map in same browser tab') + "<br>";
            html += checkboxy('settings_add_link_google_maps_on_gc_map', 'Add link to Google Maps on GC Map') + show_help("With this option an icon are placed on the GC Map page to link to the same area in Google Maps.") + "<br>";
            html += " &nbsp; " + checkboxy('settings_switch_to_google_maps_in_same_tab', 'Switch to Google Maps in same browser tab') + "<br>";
            html += "<div style='margin-top: 9px; margin-left: 5px'><b>Openstreetmap page</b></div>";
            html += checkboxy('settings_add_link_gc_map_on_osm', 'Add link to GC Map on Openstreetmap') + show_help("With this option an icon are placed on the OpenstreetMap page to link to the same area in GC Map.") + "<br>";
            html += " &nbsp; " + checkboxy('settings_switch_from_osm_to_gc_map_in_same_tab', 'Switch to GC Map in same browser tab') + "<br>";
            html += checkboxy('settings_add_link_osm_on_gc_map', 'Add link to Openstreetmap on GC Map') + show_help("With this option an icon are placed on the GC Map page to link to the same area in Openstreetmap.") + "<br>";
            html += " &nbsp; " + checkboxy('settings_switch_to_osm_in_same_tab', 'Switch to Openstreetmap in same browser tab') + "<br>";
            html += "<div style='margin-top: 9px; margin-left: 5px'><b>Flopp's Map page</b></div>";
            html += checkboxy('settings_add_link_flopps_on_gc_map', 'Add link to Flopp\'s Map on GC Map') + show_help("With this option an icon are placed on the GC Map page to link to the same area in Flopp\'s Map.") + "<br>";
            html += " &nbsp; " + checkboxy('settings_switch_to_flopps_in_same_tab', 'Switch to Flopp\'s Map in same browser tab') + "<br>";
            html += "<div style='margin-top: 9px; margin-left: 5px'><b>GeoHack page</b></div>";
            html += checkboxy('settings_add_link_geohack_on_gc_map', 'Add link to GeoHack on GC Map') + show_help("With this option an icon are placed on the GC Map page to link to the same area in GeoHack.") + "<br>";
            html += " &nbsp; " + checkboxy('settings_switch_to_geohack_in_same_tab', 'Switch to GeoHack in same browser tab') + "<br>";
            html += newParameterOn3;
            html += "<div style='margin-top: 9px; margin-left: 5px'><b>Enhanced Map Popup</b></div>";
            html += checkboxy('settings_show_enhanced_map_popup', 'Enable enhanced map popup') + show_help("With this option there will be more informations on the map popup for a cache, like latest logs or trackable count.") + "<br>";
            html += " &nbsp; &nbsp;" + "Show the <select class='gclh_form' id='settings_show_latest_logs_symbols_count_map'>";
            for (var i = 1; i <= 25; i++) {
                html += "  <option value='" + i + "' " + (settings_show_latest_logs_symbols_count_map == i ? "selected=\"selected\"" : "") + ">" + i + "</option>";
            }
            html += "</select> latest log symbols" + show_help("With this option, the choosen count of the latest logs symbols is shown at the map popup for a cache.") + "<br>";
            html += newParameterVersionSetzen(0.9) + newParameterOff;

            html += "<div class='gclh_old_new_line'>New map (search map) only</div>";
            html += newParameterOn1;
            html += checkboxy('settings_searchmap_autoupdate_after_dragging', 'Automatic search for new caches after dragging') + "<br>";
            html += newParameterVersionSetzen('0.10') + newParameterOff;
            html += "</div>";

            html += "<h4 class='gclh_headline2'>"+prepareHideable.replace("#name#","profile")+"Public profile</h4>";
            html += "<div id='gclh_config_profile' class='gclh_block'>";
            html += "<div style='margin-left: 5px'><b>Trackables</b></div>";
            html += checkboxy('settings_faster_profile_trackables', 'Load trackables faster without images') + show_help("With this option you can stop the load on the trackable pages after the necessary datas are loaded. You disclaim of the lengthy load of the images of the trackables. This procedure is much faster as load all datas, because every image is loaded separate and not in a bigger bundle like it is for the non image data.") + "<br>";
            html += "<div style='margin-top: 9px; margin-left: 5px'><b>Gallery</b></div>";
            var content_settings_show_thumbnails = checkboxy('settings_show_thumbnails', 'Show thumbnails of images') + show_help_big("With this option the images are displayed as thumbnails to have a preview. If you hover with your mouse over a thumbnail, you can see the big one.<br><br>This works in cache and TB logs, in the cache and TB image galleries, in public profile for the avatar and in the profile image gallery. <br><br>And after pressing button \"Show bigger avatars\" in cache listing, it works too for the avatars in the shown logs.") + "&nbsp; Max size of big image: <input class='gclh_form' size=3 type='text' id='settings_hover_image_max_size' value='" + settings_hover_image_max_size + "'> px <br>";
            html += content_settings_show_thumbnails;
            html += "&nbsp; " + checkboxy('settings_imgcaption_on_top', 'Show caption on top') + show_help("This option requires \"Show thumbnails of images\".");
            var content_geothumbs = "<font class='gclh_small' style='margin-left: 130px; margin-top: 4px; position: absolute;'> (Alternative: <a href='http://benchmarks.org.uk/greasemonkey/geothumbs.php' target='_blank'>Geothumbs</a> " + show_help("A great alternative to the GClh bigger image functionality with \"Show thumbnails of images\" and \"Show bigger images in gallery\", provides the script Geothumbs (Geocaching Thumbnails). <br><br>The script works like GClh with Firefox, Google Chrome and Opera as Tampermonkey script. <br><br>If you use Geothumbs, you have to uncheck both GClh bigger image functionality \"Show thumbnails of images\" and \"Show bigger images in gallery\".") + ")</font>" + "<br>";
            html += content_geothumbs;
            html += checkboxy('settings_show_big_gallery', 'Show bigger images in gallery') + show_help("With this option the images in the galleries of caches, TBs and public profiles are displayed bigger and not in 4 columns, but in 2 columns.<br><br>It runs not together with \"Show thumbnails of images\".");
            html += "<div style='margin-top: 9px; margin-left: 5px'><b>Statistic</b>" + prem + "</div>";
            html += checkboxy('settings_count_own_matrix', 'Calculate your cache matrix') + show_help("With this option the count of found difficulty and terrain combinations and the count of complete matrixes are calculated and shown above the cache matrix on your statistic page.") + "<br>";
            html += checkboxy('settings_count_foreign_matrix', 'Calculate other users cache matrix') + show_help("With this option the count of found difficulty and terrain combinations and the count of complete matrixes are calculated and shown above the cache matrix on other users statistic page.") + "<br>";
            html += checkboxy('settings_count_own_matrix_show_next', 'Mark D/T combinations for your next possible cache matrix') + show_help("With this option the necessary difficulty and terrain combinations to reach the next possible complete matrixes are marked in your cache matrix on your statistic page.") + "<br>";
            html += " &nbsp; &nbsp;" + "Highlight next <select class='gclh_form' id='settings_count_own_matrix_show_count_next' >";
            for (var i = 1; i < 5; i++) {
                html += "  <option value='" + i + "' " + (settings_count_own_matrix_show_count_next == i ? "selected=\"selected\"" : "") + ">" + i + "</option>";
            }
            html += "</select> matrixes in color <input class='gclh_form color' type='text' size=6 id='settings_count_own_matrix_show_color_next' style='margin-left: 0px;' value='" + getValue("settings_count_own_matrix_show_color_next", "5151FB") + "'>";
            html += "<img src=" + global_restore_icon + " id='restore_settings_count_own_matrix_show_color_next' title='back to default' style='width: 12px; cursor: pointer;'>" + show_help("With this option you can choose the count and the color of highlighted next possible complete matrixes in your cache matrix on your statistic page.<br><br>" + t_reqMDTc) + "<br>";
            html += " &nbsp; &nbsp;" + "Generate cache search links with radius <select class='gclh_form' id='settings_count_own_matrix_links_radius' >";
            for (var i = 0; i < 501; i++) {
                html += "  <option value='" + i + "' " + (settings_count_own_matrix_links_radius == i ? "selected=\"selected\"" : "") + ">" + i + "</option>";
            }
            html += "</select> km" + show_help("With this option cache search links with the inserted radius in km are generated for the highlighted difficulty and terrain combinations. With a radius of 0 km there are no links generated. The default radius is 25 km.<br><br>" + t_reqMDTc) + "<br>";
            html += " &nbsp; &nbsp;" + "Show the searched caches in a <select class='gclh_form' id='settings_count_own_matrix_links'>";
            html += "  <option value='map' " + (settings_count_own_matrix_links == "map" ? "selected=\"selected\"" : "") + ">map</option>";
            html += "  <option value='list' " + (settings_count_own_matrix_links == "list" ? "selected=\"selected\"" : "") + ">list</option>";
            html += "</select>" + "<br>";
            html += checkboxy('settings_log_statistic', 'Calculate number of cache and trackable logs for each logtype') + show_help("With this option, you can build a statistic for your own cache and trackable logs for each logtype on your own statistic pages.") + "<br>";
            html += "&nbsp; " + checkboxy('settings_log_statistic_percentage', 'Show percentage column') + "<br>";
            html += " &nbsp; &nbsp;" + "Automated load/reload after <select class='gclh_form' id='settings_log_statistic_reload' >";
            html += "  <option value='' " + (settings_log_statistic_reload == '' ? "selected=\"selected\"" : "") + "></option>";
            for (var i = 1; i < 49; i++) {
                html += "  <option value='" + i + "' " + (settings_log_statistic_reload == i ? "selected=\"selected\"" : "") + ">" + i + "</option>";
            }
            html += "</select> hours" + show_help("Choose no hours, if you want to load/reload only manual.") + "<br>";
            html += newParameterOn2;
            html += checkboxy('settings_map_links_statistic', 'Show links to found caches for every country on statistic map') + show_help("With this option, you can improve your own statistic maps page for you with links to caches you have found for every country.") + "<br>";
            html += newParameterVersionSetzen(0.8) + newParameterOff;
            html += "</div>";

            html += "<h4 class='gclh_headline2'>"+prepareHideable.replace("#name#","db")+"Dashboard</h4>";
            html += "<div id='gclh_config_db' class='gclh_block'>";
            html += checkboxy('settings_bookmarks_show', "Show <a class='gclh_ref' href='#gclh_linklist' title='Link to topic \"Linklist / Navigation\"' id='gclh_linklist_link_2'>Linklist</a> on your dashboard") + show_help("Show the Linklist at the sidebar on your dashboard. You can configure the links in the Linklist at the end of this configuration page.") + "<br>";
            html += checkboxy('settings_show_mail_in_allmyvips', 'Show mail link beside user in "All my VIPs/VUPs" list on your dashboard') + show_help3("With this option there will be an small mail icon beside every user in the list with all your VIPs (All my VIPs) on your dashboard page. With this icon you get directly to the mail page to mail to this user.<br>(VIP: Very important person)<br><br>If VUP processing is activated, this also applies to your VUPs (All my VUPs).<br>(VUP: Very unimportant person)<br><br>This option requires \"Show mail link beside user\" and \"Show VIP list\".") + "<br>";

            html += "<div class='gclh_old_new_line'>New dashboard only</div>";
            html += newParameterOn3;
            html += checkboxy('settings_show_default_links', 'Show all default links on your dashboard') + show_help("Show all the default links for the Linklist sorted at the sidebar on your dashboard.") + "<br>";
            html += checkboxy('settings_show_tb_inv', 'Show trackables inventory on your dashboard') + show_help("With this option a maximum of ten trackables of your trackables inventory is shown on your new dashboard. (On old dashboard it is GC standard to show it.)") + "<br>";
            html += checkboxy('settings_but_search_map', 'Show buttons "Search" and "Map" on your dashboard') + "<br>";
            html += " &nbsp; " + checkboxy('settings_but_search_map_new_tab', 'Open links in new tab') + "<br>";
            html += checkboxy('settings_compact_layout_new_dashboard', 'Show compact layout on your dashboard') + "<br>";
            html += checkboxy('settings_embedded_smartlink_ignorelist', 'Show link to Ignore List in sidebar section Lists') + show_help("Embedded a link in the section Lists to your Ignore List into the sidebar of the new dashboard.") + "<br>";
            html += newParameterVersionSetzen(0.9) + newParameterOff;
            html += newParameterOn1;
            html += checkboxy('settings_showUnpublishedHides', 'Show unpublished caches on your dashboard') + "<br>";
            html += " &nbsp; " + checkboxy('settings_set_showUnpublishedHides_sort', 'Sort unpublished caches on your dashboard') + " ";
            html += "<select class='gclh_form' id='settings_showUnpublishedHides_sort'>";
            html += "  <option value='abc' " + (settings_showUnpublishedHides_sort == 'abc' ? "selected='selected'" : "") + "> Alphabetical</option>";
            html += "  <option value='gcOld' " + (settings_showUnpublishedHides_sort == 'gcOld' ? "selected='selected'" : "") + "> GC-Code (Oldest first)</option>";
            html += "  <option value='gcNew' " + (settings_showUnpublishedHides_sort == 'gcNew' ? "selected='selected'" : "") + "> GC-Code (Newest first)</option>";
            html += "</select><br>";
            html += newParameterVersionSetzen('0.10') + newParameterOff;

            html += "<div class='gclh_old_new_line'>Old dashboard only</div>";
            html += checkboxy('settings_hide_visits_in_profile', 'Hide TB/Coin visits on your dashboard') + "<br>";
            var content_settings_logit_for_basic_in_pmo = checkboxy('settings_logit_for_basic_in_pmo', 'Log PMO caches by standard \"Log It\" icon (for basic members)') + show_help3("With this option basic members are able to choose the standard \"Log It\" icon to call the logging screen for Premium Member Only caches (PMO). The tool tipp blocked not longer this call. You can have the same result by using the right mouse across the \"Log It\" icon and then new tab. <br>The \"Log It\" icon is besides the caches for example in the \"Recently viewed caches list\" and next to the caches on your old dashboard.") + "<br>";
            html += content_settings_logit_for_basic_in_pmo;
            html += "</div>";

            html += "<h4 class='gclh_headline2'>"+prepareHideable.replace("#name#","listing")+"Listing</h4>";
            html += "<div id='gclh_config_listing' class='gclh_block'>";
            html += checkboxy('settings_log_inline', 'Log cache from listing (inline)') + show_help("With the inline log you can open a log form inside the listing, without loading a new page.") + "<br>";
            var content_settings_log_inline_tb = "&nbsp; " + checkboxy('settings_log_inline_tb', 'Show TB list') + "<br>";
            html += content_settings_log_inline_tb;
            html += checkboxy('settings_log_inline_pmo4basic', 'Log cache from listing for PMO (for basic members)') + show_help("With this option you can select, if inline logs should appear for Premium Member Only (PMO) caches althought you are a basic member.") + "<br>";
            html += content_settings_log_inline_tb.replace("settings_log_inline_tb", "settings_log_inline_tbX0");
            html += checkboxy('settings_hide_empty_cache_notes', 'Hide Personal Cache Notes if empty') + show_help("You can hide the Personal Cache Notes if they are empty. There will be a link to show them to add a note.") + prem + "<br>";
            html += checkboxy('settings_hide_cache_notes', 'Hide Personal Cache Notes completely') + show_help("You can hide the Personal Cache Notes completely, if you don't want to use them.") + prem + "<br>";
            html += newParameterOn3;
            html += checkboxy('settings_adapt_height_cache_notes', 'Adapt the height of the Personal Cache Note edit field') + show_help("The height of the Personal Cache Note edit field will be expand to show the complete note.") + prem + "<br>";
            html += newParameterVersionSetzen(0.9) + newParameterOff;
            html += checkboxy('settings_hide_disclaimer', 'Hide disclaimer') + "<br>";
            html += checkboxy('settings_hide_spoilerwarning', 'Hide spoiler warning') + "<br>";
            html += checkboxy('settings_hide_top_button', 'Hide the green "To Top" button') + show_help("Hide the green \"To Top\" button, which appears if you are reading logs.") + "<br>";
            html += checkboxy('settings_show_all_logs', 'Show at least ') + " <input class='gclh_form' type='text' size='2' id='settings_show_all_logs_count' value='" + settings_show_all_logs_count + "'> logs (0 = all)" + show_help("With this option you can choose how many logs should be shown at least if you load the listing - if you type 0, all logs are shown by default.") + "<br>";
            html += checkboxy('settings_hide_hint', 'Hide hints behind a link') + show_help("This option hides the hints behind a link. You have to click it to display the hints (already decrypted). This option remove also the description of the decryption.") + "<br>";
            html += checkboxy('settings_decrypt_hint', 'Decrypt hints') + show_help("This option decrypt the hints on cache listing and print page and remove also the description of the decryption.") + "<br>";
            html += checkboxy('settings_visitCount_geocheckerCom', 'Show statistic on geochecker.com pages') + show_help("This option adds '&visitCount=1' to all geochecker.com links. This will show some statistics on geochecker.com page like the count of page visits and the count of right and wrong attempts.") + "<br>";
            html += checkboxy('settings_show_eventday', 'Show weekday of an event') + show_help("With this option the day of the week will be displayed next to the event date.") + "<br>";
            html += checkboxy('settings_show_mail', 'Show mail link beside user') + show_help("With this option there will be an small mail icon beside every user. With this icon you get directly to the mail form to mail to this user. If you click it for example when you are in a listing, the cachename or GC code can be inserted into the mail form about placeholder in the mail / message form template.") + "<br>";
            var content_settings_show_mail_in_viplist = "&nbsp; " + checkboxy('settings_show_mail_in_viplist', 'Show mail link beside user in "VIP-List" in listing') + "<br>";
            html += content_settings_show_mail_in_viplist;
            html += "&nbsp; " + checkboxy('settings_mail_icon_new_win', 'Open mail form in new tab') + "<br>";
            html += checkboxy('settings_show_message', 'Show message link beside user') + show_help("With this option there will be an small message icon beside every user. With this icon you get directly to the message form to send a message to this user. If you click it for example when you are in a listing, the cachename or GC code can be inserted into the message form about placeholder in the mail / message form template.") + "<br>";
            html += "&nbsp; " + checkboxy('settings_message_icon_new_win', 'Open message form in new tab') + "<br>";
            html += checkboxy('settings_show_google_maps', 'Show link to Google Maps') + show_help("This option shows a link at the top of the second map in the listing. With this link you get directly to Google Maps in the area, where the cache is.") + "<br>";
            html += checkboxy('settings_strike_archived', 'Strike through title of archived/disabled caches') + "<br>";
            html += "&nbsp;" + "Highlight user changed coords with " + checkboxy('settings_highlight_usercoords', 'red textcolor ') + checkboxy('settings_highlight_usercoords_bb', 'underline ') + checkboxy('settings_highlight_usercoords_it', 'italic') + "<br>";
            html += checkboxy('settings_show_fav_percentage', 'Show percentage of favourite points') + show_help("This option loads the favourite stats of a cache in the backround and display the percentage under the amount of favourites a cache got.") + "<br>";
            html += checkboxy('settings_show_latest_logs_symbols', 'Show the ');
            html += "<select class='gclh_form' id='settings_show_latest_logs_symbols_count'>";
            for (var i = 1; i < 11; i++) {
                html += "  <option value='" + i + "' " + (settings_show_latest_logs_symbols_count == i ? "selected=\"selected\"" : "") + ">" + i + "</option>";
            }
            html += "</select> latest logs symbols at the top" + show_help("With this option, the choosen count of the latest logs symbols is shown at the top of the cache listing.<br><br>" + t_reqLlwG) + "<br>";
            html += newParameterOn3;
            html += checkboxy('settings_show_log_totals', 'Show the log totals symbols at the top') + "<br>";
            html += newParameterVersionSetzen(0.9) + newParameterOff;
            html += checkboxy('settings_show_remove_ignoring_link', 'Show \"Stop Ignoring\", if cache is already ignored') + show_help("This option replace the \"Ignore\" link description with the \"Stop Ignoring\" link description in the cache listing, if the cache is already ignored.") + prem + "<br>";
            html += newParameterOn1;
            html += "&nbsp; " + checkboxy('settings_use_one_click_ignoring', 'One click ignoring/restoring') + show_help("With this option you will be able to ignore respectively restore a cache in cache listing with only one click.") + "<br>";
            html += checkboxy('settings_use_one_click_watching', 'Add cache with one click to watchlist') + show_help("With this option, you can add a cache in cache listing to your watchlist with just one click.") + "<br>";
            html += newParameterVersionSetzen('0.10') + newParameterOff;
            html += checkboxy('settings_map_overview_build', 'Show cache location in overview map') + show_help("With this option there will be an additional map top right in the cache listing as an overview of the cache location. This was available earlier on GC standard.") + "<br>";
            html += newParameterOn3;
            html += ' &nbsp; &nbsp;Map layer: <select class="gclh_form" id="settings_map_overview_layer">';
            for (name in all_map_layers) {
                html += "  <option value='" + name + "' " + (settings_map_overview_layer == name ? "selected='selected'" : "") + "> " + name + "</option>";
            }
            html += '</select>';
            html += " &nbsp;" + "Map zoom value: <select class='gclh_form' id='settings_map_overview_zoom'>";
            for (var i = 1; i < 20; i++) {
                html += "  <option value='" + i + "' " + (settings_map_overview_zoom == i ? "selected=\"selected\"" : "") + ">" + i + "</option>";
            }
            html += "</select>" + show_help3("With this option you can choose the zoom value to start in the map. \"1\" is the hole world and \"19\" is the maximal enlargement. Default is \"11\". <br><br>This option requires \"Show cache location in overview map\".") + "<br>";
            html += newParameterVersionSetzen(0.9) + newParameterOff;
            html += checkboxy('settings_show_vip_list', 'Show VIP list') + show_help("The VIP list is a list, displayed at the right side on a cache listing. You can add any user to your VIP list by clicking the little VIP icon beside the user. If it is green, this person is a VIP. The VIP list only shows VIPs and the logs of VIPs, which already posted a log to this cache. With this option you are able to see which of your VIPs already found this cache. On your dashboard page there is an overview of all your VIPs.<br>(VIP: Very important person)") + "<br>";
            html += "&nbsp; " + checkboxy('settings_show_owner_vip_list', 'Show owner in VIP list')  + show_help("If you enable this option, the owner is a VIP for the cache, so you can see, what happened with the cache (disable, maint, enable, ...). Then the owner is shown not only in VIP list but also in VIP logs.<br>(VIP: Very important person)<br><br>" + t_reqSVl)+ "<br>";
            html += newParameterOn3;
            html += "&nbsp; " + checkboxy('settings_show_reviewer_as_vip', 'Show reviewer/publisher in VIP list')  + show_help("If you enable this option, the reviewer or publisher of the cache is a VIP for the cache.<br><br>" + t_reqSVl)+ "<br>";
            html += newParameterVersionSetzen(0.9) + newParameterOff;
            html += "&nbsp; " + checkboxy('settings_show_long_vip', 'Show long VIP list (one row per log)') + show_help("This is another type of displaying the VIP list. If you disable this option you get the short list, one row per VIP and the logs as icons beside the VIP. If you enable this option, there is a row for every log.<br>(VIP: Very important person)<br><br>" + t_reqSVl) + "<br>";
            html += "&nbsp; " + checkboxy('settings_vip_show_nofound', 'Show a list of VIPs who have not found the cache') + "<br>";
            html += "&nbsp; " + checkboxy('settings_make_vip_lists_hideable', 'Make VIP lists in listing hideable') + show_help("With this option you can hide and show the VIP lists \"VIP-List\" and \"VIP-List not found\" in cache listing with one click.<br>(VIP: Very important person)<br><br>" + t_reqSVl) + "<br>";
            html += content_settings_show_mail_in_viplist.replace("in_viplist", "in_viplistX0");
            html += "&nbsp; " + checkboxy('settings_process_vup', 'Process VUPs') + show_help("With this option you can activate the processing to add any user to a VUP list by clicking the little VUP icon beside the user. If it is red, this person is a VUP. For such persons in cache logs will only shown \"censored\" instead of the log text. On your dashboard page there is an overview of all your VUPs.<br>(VUP: Very unimportant person)<br><br>" + t_reqSVl) + "<br>";
            html += " &nbsp; &nbsp; " + checkboxy('settings_vup_hide_avatar', 'Also hide name, avatar and counter from log') + "<br>";
            html += " &nbsp; &nbsp; &nbsp; " + checkboxy('settings_vup_hide_log', 'Hide complete log') + "<br>";
            html += checkboxy('settings_link_big_listing', 'Replace image links in cache listing to bigger image') + show_help("With this option the links of owner images in the cache listing points to the bigger, original image.") + "<br>";
            html += content_settings_show_thumbnails.replace("show_thumbnails", "show_thumbnailsX0").replace("max_size", "max_sizeX0");
            html += " &nbsp; &nbsp;" + "Spoiler filter: <input class='gclh_form' type='text' id='settings_spoiler_strings' value='" + settings_spoiler_strings + "'> " + show_help("If one of these words is found in the caption of the image, there will be no real thumbnail. It is to prevent seeing spoilers. Words have to be divided by |. If the field is empty, no checking is done. Default is \"spoiler|hinweis\".<br><br>This option requires \"Show thumbnails of images\".") + "<br>";
            html += "&nbsp; " + checkboxy('settings_imgcaption_on_topX0', 'Show caption on top') + show_help("This option requires \"Show thumbnails of images\".");
            html += content_geothumbs;
            html += checkboxy('settings_hide_avatar', 'Hide avatars in listing') + show_help("This option hides the avatars in logs. This prevents loading the hundreds of images. You have to change the option here, because GClh overrides the log-load-logic of GC, so the avatar option of GC doesn't work with GClh.") + "<br>";
            html += checkboxy('settings_load_logs_with_gclh', 'Load logs with GClh') + show_help("This option should be enabled. <br><br>You just should disable it, if you have problems with loading the logs. <br><br>If this option is disabled, there are no VIP-, VUP-, mail-, message- and top icons, no line colors and no mouse activated big images at the logs. Also the VIP and VUP lists, hide avatars, log filter and log search won't work.") + "<br>";
            html += checkboxy('settings_show_real_owner', 'Show real owner name') + show_help("If the option is enabled, GClh will replace the pseudonym a owner took to publish the cache with the real owner name.") + "<br>";
            html += checkboxy('settings_img_warning', 'Show warning for unavailable images') + show_help("With this option the images in the cache listing will be checked for existence before trying to load it. If an image is unreachable or dosen't exists, a placeholder is shown. The mouse over the placeholder will shown the image link. A mouse click to the placeholder will open the link in a new tab.") + "<br>";
            html += checkboxy('settings_driving_direction_link', 'Show link to Google driving direction for every waypoint') + show_help("Shows for every waypoint in the waypoint list a link to Google driving direction from home location to coordinates of the waypoint.") + "<br>";
            html += "&nbsp; " + checkboxy('settings_driving_direction_parking_area', 'Only for parking area waypoints') + "<br>";
            html += checkboxy('settings_show_elevation_of_waypoints', 'Show elevations for waypoints and listing coordinates') + show_help("Shows the elevation of every additional waypoint and the (changed) listing coordinates. Select the order of the elevation service or deactivate it. Queries from the Google Elevation service is limited. Use the Open Elevation service as second source. Hover of the elevation data of a waypoint shows a tooltip with the used service.") + "<br>";
            html += " &nbsp; &nbsp;" + "Measure unit can be set in <a href=\"/account/settings/preferences\">Preferences</a>" + "<br>";
            html += newParameterOn3;
            html += "&nbsp;&nbsp;&nbsp;" + "First service: <select class='gclh_form' id='settings_primary_elevation_service' style='width: 160px;'>";
            for (var i = 1; i < elevationServicesData.length; i++) {
                html += "  <option value='"+i+"' " + (settings_primary_elevation_service == i ? "selected=\"selected\"" : "") + ">"+elevationServicesData[i]['name']+"</option>";
            }
            html += "</select>";
            html += "&nbsp;&nbsp;" + "Second service: <select class='gclh_form' id='settings_secondary_elevation_service' style='width: 160px;'>";
            for (var i = 0; i < elevationServicesData.length; i++) {
                html += "  <option value='"+i+"' " + (settings_secondary_elevation_service == i ? "selected=\"selected\"" : "") + ">"+elevationServicesData[i]['name']+"</option>";
            }
            html += "</select><br>";
            html += newParameterVersionSetzen(0.9) + newParameterOff;
            html += newParameterOn2;
            html += checkboxy('settings_improve_add_to_list', 'Show compact layout in \"Add to list\" popup to bookmark a cache') + prem + "<br>";
            html += " &nbsp; &nbsp;" + "Height of popup: <select class='gclh_form' id='settings_improve_add_to_list_height' >";
            for (var i = 100; i < 521; i++) {
                html += "  <option value='" + i + "' " + (settings_improve_add_to_list_height == i ? "selected=\"selected\"" : "") + ">" + i + "</option>";
            }
            html += "</select> px" + show_help("With this option you can choose the height of the \"Add to list\" popup to bookmark a cache from 100 up to 520 pixel. The default is 205 pixel, similar to the standard.<br><br>This option requires \"Show compact layout in \"Add to list\" popup to bookmark a cache\".") + prem + "<br>";
            html += checkboxy('settings_show_flopps_link', 'Show Flopp\'s Map links in sidebar and under the "Additional Waypoints"') + show_help3("If there are no additional waypoints only the link in the sidebar is shown.") + "<br>";
            html += checkboxy('settings_show_brouter_link', 'Show BRouter links in sidebar and under the "Additional Waypoints"') + show_help3("If there are no additional waypoints only the link in the sidebar is shown.") + "<br>";
            html += newParameterVersionSetzen(0.8) + newParameterOff;
            html += newParameterOn3;
            html += checkboxy('settings_show_gpsvisualizer_link', 'Show GPSVisualizer links in sidebar and under the "Additional Waypoints"') + show_help3("If there are no additional waypoints only the link in the sidebar is shown.") + "<br>";
            html += "&nbsp;&nbsp;" + checkboxy('settings_show_gpsvisualizer_gcsymbols', 'Use Geocaching symbols on GPSVisualizer map') + show_help3("Instead of default icon/pin Geocaching symbols are used. If the URL is too long deactivate this option.") + "<br>";
            html += "&nbsp;&nbsp;" + checkboxy('settings_show_gpsvisualizer_typedesc', 'Transfer type of the waypoint as description') + show_help3("Transfer for every waypoint the type as text in the description. If the URL is too long deactivate this option.") + "<br>";
            html += newParameterVersionSetzen(0.9) + newParameterOff;
            html += newParameterOn1;
            html += checkboxy('settings_show_openrouteservice_link', 'Show Openrouteservice links in sidebar and under the "Add. Waypoints"') + show_help3("If there are no additional waypoints only the link in the sidebar is shown.") + "<br>";
            html += "&nbsp;&nbsp;" + checkboxy('settings_show_openrouteservice_home', 'Use home coordinates as start point') + show_help("You can use your home coordinates, here in the GClh Config, as start point and first waypoint for the route calculation.") + "<br>";
            html += "&nbsp;&nbsp;&nbsp;" + "Medium for locomotion: <select class='gclh_form' id='settings_show_openrouteservice_medium' style='width: 200px;'>";
            html += "  <option value=\"0\" " + (settings_show_openrouteservice_medium == "0" ? "selected=\"selected\"" : "") + ">Car</option>";
            html += "  <option value=\"1\" " + (settings_show_openrouteservice_medium == "1" ? "selected=\"selected\"" : "") + ">Bike</option>";
            html += "  <option value=\"1b\" " + (settings_show_openrouteservice_medium == "1b" ? "selected=\"selected\"" : "") + ">Mountain bike</option>";
            html += "  <option value=\"1c\" " + (settings_show_openrouteservice_medium == "1c" ? "selected=\"selected\"" : "") + ">Racing bike</option>";
            html += "  <option value=\"1f\" " + (settings_show_openrouteservice_medium == "1f" ? "selected=\"selected\"" : "") + ">E-Bike</option>";
            html += "  <option value=\"2\" " + (settings_show_openrouteservice_medium == "2" ? "selected=\"selected\"" : "") + ">Pedestrian walking</option>";
            html += "  <option value=\"2b\" " + (settings_show_openrouteservice_medium == "2b" ? "selected=\"selected\"" : "") + ">Pedestrian hiking</option>";
            html += "  <option value=\"3\" " + (settings_show_openrouteservice_medium == "3" ? "selected=\"selected\"" : "") + ">Wheelchair (only Europe)</option>";
            html += "</select>" + "<br>";
            html += checkboxy('settings_show_copydata_menu', 'Show "Copy Data to Clipboard" menu in sidebar') + show_help3("Shows a menu to copy various cache data to the clipboard.") + "<br>";
            html += newParameterVersionSetzen("0.10") + newParameterOff;
            html += newParameterOn3;
            html += checkboxy('settings_show_all_logs_but', 'Show button \"Show all logs\" above the logs') + "<br>";
            html += checkboxy('settings_show_log_counter_but', 'Show button \"Show log counter\" above the logs') + "<br>";
            html += "&nbsp;&nbsp;" + checkboxy('settings_show_log_counter', 'Show log counter when opening cache listing') + "<br>";
            html += checkboxy('settings_show_bigger_avatars_but', 'Show button \"Show bigger avatars\" above the logs') + "<br>";
            html += newParameterVersionSetzen(0.9) + newParameterOff;
            html += newParameterOn1;
            html += checkboxy('settings_show_compact_logbook_but', 'Show button \"Show/Hide compact logs\" above the logs') + "<br>";
            html += checkboxy('settings_hide_found_count', 'Hide found count') + "<br>";
            html += checkboxy('settings_cache_type_icon_visible', 'Set cache type icon always visible') + show_help("With this option, the cache type icon is always displayed complete, even if the cache is deactivated or archived.") + "<br>";
            html += checkboxy('settings_log_status_icon_visible', 'Set log status icon always visible') + show_help("With this option, the log status icon is always displayed complete, even if the cache is deactivated or archived. The log status icon is located above the cache type icons and indicates for example if a cache was found, if there is a personal note or if there are corrected coordinates.") + "<br>";
            html += newParameterVersionSetzen("0.10") + newParameterOff;
            html += "</div>";

            html += "<h4 class='gclh_headline2'>"+prepareHideable.replace("#name#","logging")+"Logging</h4>";
            html += "<div id='gclh_config_logging' class='gclh_block'>";
            html += checkboxy('settings_show_bbcode', 'Show smilies') + show_help("This option displays smilies options beside the log form. If you click on a smilie, it is inserted into your log.") + "<br>";
            html += checkboxy('settings_replace_log_by_last_log', 'Replace log by last log template') + show_help("If you enable this option, the last log template will replace the whole log. If you disable it, it will be appended to the log.") + "<br>";
            html += newParameterOn3;
            html += checkboxy('settings_auto_open_tb_inventory_list', 'Auto open Trackable Inventory') + show_help("If you enable this option, the list of your Trackables is automatically expended when you load the log page.") + "<br>";
            html += newParameterVersionSetzen(0.9) + newParameterOff;
            html += content_settings_show_log_it.replace("show_log_it", "show_log_itX2");
            html += content_settings_logit_for_basic_in_pmo.replace("basic_in_pmo","basic_in_pmoX0");
            html += newParameterOn3;
            html += checkboxy('settings_show_pseudo_as_owner', 'Take also owner pseudonym to replace placeholder owner') + show_help("If you enable this option, the placeholder for the owner is replaced possibly by the pseudonym of the owner if the real owner is not known.<br><br>On the new designed log page there is shown as owner of the cache not the real owner but possibly the pseudonym of the owner for the cache as it is shown in the cache listing under \"A cache by\". The real owner is not available in this cases.") + "<br>";
            html += newParameterVersionSetzen(0.9) + newParameterOff;
            var placeholderDescription = "Possible placeholder:<br>&nbsp; #Found# : Your founds + 1<br>&nbsp; #Found_no# : Your founds<br>&nbsp; #Me# : Your username<br>&nbsp; #Owner# : Username of the owner<br>&nbsp; #Date# : Actual date<br>&nbsp; #Time# : Actual time in format hh:mm<br>&nbsp; #DateTime# : Actual date actual time<br>&nbsp; #GCTBName# : GC or TB name<br>&nbsp; #GCTBLink# : GC or TB link<br>&nbsp; #GCTBNameLink# : GC or TB name as a link<br>&nbsp; #LogDate# : Content of field \"Date Logged\"<br>(Upper and lower case is not required in the placeholder name.)";
            html += "&nbsp;" + "Log templates:" + show_help("Log templates are predefined texts. All your templates are shown beside the log form. You just have to click to a template and it will be placed in your log. <br><br>Also you are able to use placeholder for variables which will be replaced in the log. The smilies option has to be enabled. <br><br>Note: You have to set a title and a text. Click to the edit icon beside the template to edit the text.") + " &nbsp; (Possible placeholder:" + show_help_big(placeholderDescription) + ")<br>";
            html += "<font class='gclh_small' style='font-style: italic; margin-left: 240px; margin-top: 25px; width: 320px; position: absolute; z-index: -1;' >Bitte beachte, dass Logtemplates nützlich sind, um automatisiert die Fundzahl, das Funddatum und ähnliches im Log einzutragen, dass aber Cache Owner Menschen sind, die sich über individuelle Logs zu ihrem Cache freuen. Beim Geocachen geht es nicht nur darum, die eigene Statistik zu puschen, sondern auch darum, etwas zu erleben. Bitte nimm dir doch etwas Zeit, den Ownern etwas wiederzugeben, indem du ihnen von Deinen Erlebnissen berichtest und ihnen gute Logs schreibst. Dann wird es auch in Zukunft Cacher geben, die sich gerne die Mühe machen, neue Caches auszulegen. Die Logtemplates sind also nützlich, können aber niemals ein vollständiges Log ersetzen.</font>";
            for (var i = 0; i < anzTemplates; i++) {
                html += "&nbsp;" + "<input class='gclh_form' type='text' size='15' id='settings_log_template_name[" + i + "]' value='" + getValue('settings_log_template_name[' + i + ']', '') + "'> ";
                html += "<a onClick=\"if(document.getElementById(\'settings_log_template_div[" + i + "]\').style.display == \'\') document.getElementById(\'settings_log_template_div[" + i + "]\').style.display = \'none\'; else document.getElementById(\'settings_log_template_div[" + i + "]\').style.display = \'\'; return false;\" href='#'><img src='/images/stockholm/16x16/page_white_edit.gif' border='0'></a><br>";
                html += "<div id='settings_log_template_div[" + i + "]' style='display: none;'>&nbsp;&nbsp;&nbsp;&nbsp;<textarea class='gclh_form' rows='4' cols='54' id='settings_log_template[" + i + "]'>&zwnj;" + getValue("settings_log_template[" + i + "]", "") + "</textarea></div>";
            }
            html += "&nbsp;" + "Cache log signature:" + show_help("The signature will automatically be inserted into your logs. <br><br>Also you are able to use placeholder for variables which will be replaced in the log.") + " &nbsp; (Possible placeholder:" + show_help_big(placeholderDescription) + ")<br>";
            html += "&nbsp;" + "<textarea class='gclh_form' rows='3' cols='56' id='settings_log_signature'>&zwnj;" + getValue("settings_log_signature", "") + "</textarea><br>";
            html += checkboxy('settings_log_signature_on_fieldnotes', 'Add log signature on drafts logs') + show_help('If this option is disabled, the log signature will not be used by logs out of drafts. You can use it, if you already have an signature in your drafts.') + "<br>";
            html += "&nbsp;" + "TB log signature:" + show_help("The signature will automatically be inserted into your TB logs. <br><br>Also you are able to use placeholder for variables which will be replaced in the log.") + " &nbsp; (Possible placeholder:" + show_help_big(placeholderDescription) + ")<br>";
            html += "&nbsp;" + "<textarea class='gclh_form' rows='3' cols='56' id='settings_tb_signature' style='margin-top: 2px;'>&zwnj;" + getValue("settings_tb_signature", "") + "</textarea><br>";

            html += "<div class='gclh_old_new_line'>Old logging page only</div>";
            html += content_settings_submit_log_button.replace("log_button","log_buttonX2");
            html += checkboxy('settings_autovisit', 'Enable \"AutoVisit\" feature for trackables') + show_help("With this option you are able to select trackables which should be automatically set from \"No action\" to \"Visited\" on every log, if the logtype is \"Found It\", \"Webcam Photo Taken\" or \"Attended\". For other logtypes trackables are automatically set from \"Visited\" to \"No action\". You can select \"AutoVisit\" for each trackable in the list on the bottom of the log form.") + "<br>";
            html += checkboxy('settings_fieldnotes_old_fashioned', 'Logging drafts old-fashioned') + show_help("This option deactivates on old drafts page the logging of drafts by the new log page and activates logging of drafts by the old-fashioned log page.") + "<br>";
            html += "<table><tbody>";
            html += "  <tr><td>Default log type:</td>";
            html += "    <td><select class='gclh_form' id='settings_default_logtype'>";
            html += "    <option value=\"-1\" " + (settings_default_logtype == "-1" ? "selected=\"selected\"" : "") + ">- Select type of log -</option>";
            html += "    <option value=\"2\" " + (settings_default_logtype == "2" ? "selected=\"selected\"" : "") + ">Found it</option>";
            html += "    <option value=\"3\" " + (settings_default_logtype == "3" ? "selected=\"selected\"" : "") + ">Didn't find it</option>";
            html += "    <option value=\"4\" " + (settings_default_logtype == "4" ? "selected=\"selected\"" : "") + ">Write note</option>";
            html += "    <option value=\"7\" " + (settings_default_logtype == "7" ? "selected=\"selected\"" : "") + ">Needs archived</option>";
            html += "    <option value=\"45\" " + (settings_default_logtype == "45" ? "selected=\"selected\"" : "") + ">Needs maintenance</option></select></td>";
            html += "  <tr><td>Default event log type:</td>";
            html += "    <td><select class='gclh_form' id='settings_default_logtype_event'>";
            html += "    <option value=\"-1\" " + (settings_default_logtype_event == "-1" ? "selected=\"selected\"" : "") + ">- Select type of log -</option>";
            html += "    <option value=\"4\" " + (settings_default_logtype_event == "4" ? "selected=\"selected\"" : "") + ">Write note</option>";
            html += "    <option value=\"7\" " + (settings_default_logtype_event == "7" ? "selected=\"selected\"" : "") + ">Needs archived</option>";
            html += "    <option value=\"9\" " + (settings_default_logtype_event == "9" ? "selected=\"selected\"" : "") + ">Will attend</option>";
            html += "    <option value=\"10\" " + (settings_default_logtype_event == "10" ? "selected=\"selected\"" : "") + ">Attended</option></select></td>";
            html += "  <tr><td>Default owner log type:</td>";
            html += "    <td><select class='gclh_form' id='settings_default_logtype_owner'>";
            html += "    <option value=\"-1\" " + (settings_default_logtype_owner == "-1" ? "selected=\"selected\"" : "") + ">- Select type of log -</option>";
            html += "    <option value=\"4\" " + (settings_default_logtype_owner == "4" ? "selected=\"selected\"" : "") + ">Write note</option>";
            html += "    <option value=\"5\" " + (settings_default_logtype_owner == "5" ? "selected=\"selected\"" : "") + ">Archive</option>";
            html += "    <option value=\"23\" " + (settings_default_logtype_owner == "23" ? "selected=\"selected\"" : "") + ">Enable listing</option>";
            html += "    <option value=\"18\" " + (settings_default_logtype_owner == "18" ? "selected=\"selected\"" : "") + ">Post reviewer note</option></select></td>";
            html += "  <tr><td>Default TB log type:</td>";
            html += "    <td><select class='gclh_form' id='settings_default_tb_logtype'>";
            html += "    <option value=\"-1\" " + (settings_default_tb_logtype == "-1" ? "selected=\"selected\"" : "") + ">- Select type of log -</option>";
            html += "    <option value=\"13\" " + (settings_default_tb_logtype == "13" ? "selected=\"selected\"" : "") + ">Retrieve from ..</option>";
            html += "    <option value=\"19\" " + (settings_default_tb_logtype == "19" ? "selected=\"selected\"" : "") + ">Grab it from ..</option>";
            html += "    <option value=\"4\" " + (settings_default_tb_logtype == "4" ? "selected=\"selected\"" : "") + ">Write note</option>";
            html += "    <option value=\"48\" " + (settings_default_tb_logtype == "48" ? "selected=\"selected\"" : "") + ">Discovered it</option></select></td>";
            html += "</tbody></table>";
            html += "</div>";

            html += "<h4 class='gclh_headline2'>"+prepareHideable.replace("#name#","mail")+"Mail / Message form</h4>";
            html += "<div id='gclh_config_mail' class='gclh_block'>";
            var placeholderDescriptionMail = "Possible placeholder Mail / Message form:<br>&nbsp; #Found# : Your founds + 1<br>&nbsp; #Found_no# : Your founds<br>&nbsp; #Me# : Your username<br>&nbsp; #Receiver# : Username of the receiver<br>&nbsp; #Date# : Actual date<br>&nbsp; #Time# : Actual time in format hh:mm<br>&nbsp; #DateTime# : Actual date actual time<br>&nbsp; #GCTBName# : GC or TB name<br>&nbsp; #GCTBCode# : GC or TB code in brackets<br>&nbsp; #GCTBLink# : GC or TB link in brackets<br>(Upper and lower case is not required in the placeholder name.)";
            html += "&nbsp;" + "Template:" + show_help2("The template will automatically be inserted into your mails and messages. <br><br>Also you are able to use placeholder for variables which will be replaced in the mail and in the message.") + " &nbsp; (Possible placeholder:" + show_help_big(placeholderDescriptionMail) + ")<br>";
            html += "&nbsp;" + "<textarea class='gclh_form' rows='7' cols='56' id='settings_mail_signature'>&zwnj;" + getValue("settings_mail_signature", "") + "</textarea><br>";
            html += "</div>";

            html += "<h4 class='gclh_headline2'><a name='gclh_linklist'></a>"+prepareHideable.replace("#name#","linklist")+"Linklist / Navigation <span style='font-size: 14px'>" + show_help("In this section you can configure your personal Linklist which is shown on the top of the page and/or on your dashboard. You can activate it in the \"Global\" or \"Dashboard\" section.") + "</span></h4>";
            html += "<div id='gclh_config_linklist' class='gclh_block'>";
            html += newParameterOn3;
            html += checkboxy('settings_show_draft_indicator', 'Show draft indicator') + "<br>";
            html += newParameterVersionSetzen(0.9) + newParameterOff;
            html += "&nbsp;" + "Remove from navigation:" + show_help("Here you can select, which of the original GC drop-down lists should be removed.") + "<br>";
            html += "<input type='checkbox' " + (getValue('remove_navi_play') ? "checked='checked'" : "" ) + " id='remove_navi_play'>Play<br>";
            html += "<input type='checkbox' " + (getValue('remove_navi_community') ? "checked='checked'" : "" ) + " id='remove_navi_community'>Community<br>";
            html += "<input type='checkbox' " + (getValue('remove_navi_shop') ? "checked='checked'" : "" ) + " id='remove_navi_shop'>Shop<br><br>";
            html += "<input type='checkbox' " + (settings_bookmarks_search ? "checked='checked'" : "" ) + " id='settings_bookmarks_search'>Show searchfield. Default value: <input class='gclh_form' type='text' id='settings_bookmarks_search_default' value='" + settings_bookmarks_search_default + "' size='4'>" + show_help("If you enable this option, there will be a searchfield on the top of the page. In this field you can search for GC Ids, TB Ids, tracking numbers, coordinates, ... . Also you can define a default value if you want (like GC ...).<br><br>" + t_reqSLoT) + "<br>";

            html += "<input type='radio' " + (settings_bookmarks_top_menu ? "checked='checked'" : "" ) + " name='top_menu' id='settings_bookmarks_top_menu' style='margin-top: 9px;'>Show Linklist at menu as drop-down list" + show_help("With this option your Linklist will be shown at the navigation menu as a drop-down list beside the others.") + "<br>";
            html += "<div id='box_top_menu_v' style='margin-left: 16px; margin-bottom: 2px; height: 141px;' >";
            html += checkboxy('settings_menu_float_right', 'Arrange the menu right') + show_help("With this option you can arrange the navigation menu with the Linklist and the other drop-down lists in the right direction. The default is an orientation in the left direction.<br><br>" + t_reqChlSLoT) + "<br>";
            html += "&nbsp;" + "Font color at menu: <input class='gclh_form color' type='text' size=6 id='settings_font_color_menu' value='" + getValue("settings_font_color_menu", "93B516") + "'>";
            html += "<img src=" + global_restore_icon + " id='restore_settings_font_color_menu' title='back to default' style='width: 12px; cursor: pointer;'>" + show_help("With this option you can choose the font color at the navigation menu. The default font color is 93B516 (lime green).<br><br>" + t_reqChl) + "<br>";
            html += "&nbsp;" + "Font size at menu: <select class='gclh_form' id='settings_font_size_menu'>";
            for (var i = 6; i < 17; i++) {
                html += "  <option value='" + i + "' " + (settings_font_size_menu == i ? "selected=\"selected\"" : "") + ">" + i + "</option>";
            }
            html += "</select> px" + show_help("With this option you can choose the font size at the navigation menu in pixel. The default font size is 16 pixel.<br><br>" + t_reqChl) + "<br>";
            html += "&nbsp;" + "Distance between menu entries: <select class='gclh_form' id='settings_distance_menu'>";
            for (var i = 0; i < 100; i++) {
                html += "  <option value='" + i + "' " + (settings_distance_menu == i ? "selected=\"selected\"" : "") + ">" + i + "</option>";
            }
            html += "</select> px" + show_help("With this option you can choose the distance between the navigation menu entries in horizontal direction in pixel.<br><br>" + t_reqChl) + "<br>";
            html += "&nbsp;" + "Font color at drop-down lists: <input class='gclh_form color' type='text' size=6 id='settings_font_color_submenu' value='" + getValue("settings_font_color_submenu", "93B516") + "'>";
            html += "<img src=" + global_restore_icon + " id='restore_settings_font_color_submenu' title='back to default' style='width: 12px; cursor: pointer;'>" + show_help("With this option you can choose the font color at the drop-down lists. The default font color is 93B516 (lime green).<br><br>" + t_reqChl) + "<br>";
            html += "&nbsp;" + "Font size at drop-down lists: <select class='gclh_form' id='settings_font_size_submenu'>";
            for (var i = 6; i < 17; i++) {
                html += "  <option value='" + i + "' " + (settings_font_size_submenu == i ? "selected=\"selected\"" : "") + ">" + i + "</option>";
            }
            html += "</select> px" + show_help("With this option you can choose the font size at the drop-down lists in pixel. The default font size is 15 pixel.<br><br>" + t_reqChl) + "<br>";
            html += "&nbsp;" + "Distance between drop-down links: <select class='gclh_form' id='settings_distance_submenu'>";
            for (var i = 0; i < 33; i++) {
                html += "  <option value='" + i + "' " + (settings_distance_submenu == i ? "selected=\"selected\"" : "") + ">" + i + "</option>";
            }
            html += "</select> px" + show_help("With this option you can choose the distance between the drop-down links in vertical direction in pixel.<br><br>" + t_reqChl) + "<br>";
            html += "</div>";

            html += "<input type='radio' " + (settings_bookmarks_top_menu ? "" : "checked='checked'" ) + " name='top_menu' id='settings_bookmarks_top_menu_h'>Show Linklist in horizontal direction" + show_help("If you enable this option, the links in your Linklist will be shown direct on the top of the page, side by side.<br><br>" + t_reqChlSLoT) + "<br>";
            html += "<div id='box_top_menu_h' style='margin-left: 16px; height: 188px;' >";
            html += "&nbsp;" + "Font color at menu: <input class='gclh_form color' type='text' size=6 id='settings_font_color_menuX0' value='" + getValue("settings_font_color_menu", "93B516") + "'>";
            html += "<img src=" + global_restore_icon + " id='restore_settings_font_color_menuX0' title='back to default' style='width: 12px; cursor: pointer;'>" + show_help("With this option you can choose the font color at the links. The default font color is 93B516 (lime green).<br><br>" + t_reqChlSLoT) + "<br>";
            html += "&nbsp;" + "Font size at the links: <select class='gclh_form' id='settings_font_size_menuX0'>";
            for (var i = 6; i < 17; i++) {
                html += "  <option value='" + i + "' " + (settings_font_size_menu == i ? "selected=\"selected\"" : "") + ">" + i + "</option>";
            }
            html += "</select> px" + show_help("With this option you can choose the font size at the links in pixel. The default font size is 16 pixel.<br><br>" + t_reqChlSLoT) + "<br>";
            html += "&nbsp;" + "Distance between the links: <select class='gclh_form' id='settings_distance_menuX0'>";
            for (var i = 0; i < 100; i++) {
                html += "  <option value='" + i + "' " + (settings_distance_menu == i ? "selected=\"selected\"" : "") + ">" + i + "</option>";
            }
            html += "</select> px" + show_help("With this option you can choose the distance between the links in horizontal direction in pixel. <br><br>" + t_reqChlSLoT) + "<br>";
            html += "&nbsp;" + "Number of lines for all links: <select class='gclh_form' id='settings_menu_number_of_lines'>";
            html += "  <option value=\"1\" " + (settings_menu_number_of_lines == "1" ? "selected=\"selected\"" : "") + ">1</option>";
            html += "  <option value=\"2\" " + (settings_menu_number_of_lines == "2" ? "selected=\"selected\"" : "") + ">2</option>";
            html += "  <option value=\"3\" " + (settings_menu_number_of_lines == "3" ? "selected=\"selected\"" : "") + ">3</option>";
            html += "</select>" + show_help("With this option you can choose the number of lines which are necessary to include all the links of the Linklist in the header of the page.<br><br>" + t_reqChlSLoT) + "<br>";
            html += "<input type='checkbox' " + (getValue('settings_menu_show_separator') ? "checked='checked'" : "" ) + " id='settings_menu_show_separator'>Show separator between the links" + show_help(t_reqChlSLoT) + "<br>";
            html += "&nbsp;" + "Font color at GC drop-down lists: <input class='gclh_form color' type='text' size=6 id='settings_font_color_submenuX0' value='" + getValue("settings_font_color_submenu", "93B516") + "'>";
            html += "<img src=" + global_restore_icon + " id='restore_settings_font_color_submenuX0' title='back to default' style='width: 12px; cursor: pointer;'>" + show_help("With this option you can choose the font color at the GC drop-down lists. The default font color is 93B516 (lime green).<br><br>" + t_reqChlSLoT) + "<br>";
            html += "&nbsp;" + "Font size at GC drop-down lists: <select class='gclh_form' id='settings_font_size_submenuX0'>";
            for (var i = 6; i < 17; i++) {
                html += "  <option value='" + i + "' " + (settings_font_size_submenu == i ? "selected=\"selected\"" : "") + ">" + i + "</option>";
            }
            html += "</select> px" + show_help("With this option you can only choose the font size at the remaining GC drop-down lists in pixel. The default font size is 15 pixel.<br><br>" + t_reqChlSLoT) + "<br>";
            html += "&nbsp;" + "Distance between GC drop-down links: <select class='gclh_form' id='settings_distance_submenuX0'>";
            for (var i = 0; i < 33; i++) {
                html += "  <option value='" + i + "' " + (settings_distance_submenu == i ? "selected=\"selected\"" : "") + ">" + i + "</option>";
            }
            html += "</select> px" + show_help("With this option you can only choose the distance between the remaining GC drop-down links in vertical direction in pixel. <br><br>" + t_reqChlSLoT) + "<br>";
            html += "</div>";
            html += "<br>";

            // Linklist: Rechte Spalte mit den ausgewählten BMs.
            // ---------
            var firstCust = 0;
            for (var j = 0; j < bookmarks.length; j++) {
                if (bookmarks[j].custom) {
                    firstCust = j;
                    break;
                }
            }
            html += "<div style='float:right; width:197px;margin-left:10px;' div>";
            // Überschrift, rechte Spalte.
            html += "<p class='ll_heading'>Linklist" + show_help("In this column you can organize your Linklist. With the left button you can grab and move an element forwards or backwards. With the right button you can delete an element from the Linklist. You delete the element only from the Linklist, in the left columns the element is preserved.<br><br>The Linklist requires \"Show Linklist on top\" or \"Show Linklist on your dashboard\".") + "</p>";
            html += "<table class='gclh_form' style='width:100%; border: 2px solid #778555; border-radius: 7px; border-collapse: inherit;'>";
            // Ausgewählte BMs für Linklist, rechte Spalte.
            html += "  <tbody id='gclh_LinkListTop'>";
            var order = JSON.parse(getValue("settings_bookmarks_list", "[]").replace(/, (?=,)/g, ",null"));
            // Platzhalter, falls keine BMs ausgewählt.
            if (order.length == 0) {
                html += "    <tr style='height: 25px;' class='gclh_LinkListPlaceHolder'>";
                html += "      <td>Drop here...</td></tr>";
            } else {
                for (var i = 0; i < order.length; i++) {
                    if (typeof(order[i]) == "undefined") continue;
                    if (typeof(order[i]) == "object") continue;
                    if (typeof(bookmarks[order[i]]) == "undefined") continue;
                    if (bookmarks[order[i]].custom) {
                        var text = (typeof(bookmarks_orig_title[order[i]]) != "undefined" && bookmarks_orig_title[order[i]] != "" ? bookmarks_orig_title[order[i]] : bookmarks[order[i]]['title']);
                        var textTitle = "Custom" + (order[i] - firstCust);
                        if (!text.match(/(\S+)/)) text = textTitle;
                    } else {
                        var text = bookmarks[order[i]]['title'];
                        var textTitle = (typeof(bookmarks_orig_title[order[i]]) != "undefined" && bookmarks_orig_title[order[i]] != "" ? bookmarks_orig_title[order[i]] : bookmarks[order[i]]['title']);
                    }
                    var textName = textTitle;
                    html += "    <tr style='height: 25px;' class='gclh_LinkListInlist' id='gclh_LinkListTop_" + order[i] + "' name='" + textName + "' title='" + textTitle + "'>";
                    html += "      <td style='vertical-align: top; text-overflow: ellipsis; max-width: 166px; overflow: hidden; white-space: nowrap;'>";
                    html += "        <img style='height: 12px; margin-right: 3px; cursor: grab;' title='Grab it' src='" + global_grab_it_icon + "'/>";
                    html +=          text;
                    html += "      </td>";
                    html += "      <td><img style='height: 20px; margin-left: 0px; vertical-align: top; cursor: pointer;' title ='Delete it' class='gclh_LinkListDelIcon' src='" + global_del_it_icon + "'/></td></tr>";
                }
            }
            html += "  </tbody>";
            html += "</table>";
            html += "</div>";

            // Linklist: Beide linken Spalten mit möglichen BMs und abweichenden Bezeichnungen und Seitenbuttons.
            // ---------
            // BMs nach Bezeichnung sortieren.
            sortBookmarksByDescription(settings_sort_default_bookmarks, bookmarks);

            html += "<table>";
            // Überschrift.
            html += "  <thead>";
            html += "    <tr><td><span class='ll_heading' title='Default links for the Linklist'>Default links</span>" + show_help2("In this column are the default links for the Linklist. There are standard links and custom links.<br><br>You can choose the standard links you want to use in your Linklist.<br><br>If there is a text field, then it is a custom link. In this text field you can type any URL you want to be added to the Linklist. The checkbox behind defines, if the link should be opened in a new window.<br><br>With the left button you can grab and move an element to the Linklist.<br><br>If you have problems to drag & drop the lower links because the Linklist area is not on the screen, then use the arrow high key on your keyboard during you hold the mouseclick.") + "</td>";
            html += "      <td><span class='ll_heading' title='Differing description / description'>Description</span>" + show_help("In this column you can type a differing description for the standard link, if it is a standard link. <br><br>If it is a custom link, you have to type a decription for the custom link. <br><br>If you have problems to drag & drop the lower links because the Linklist area is not on the screen, then use the arrow high key on your keyboard during you hold the mouseclick.") + "</td></tr>";
            html += "  </thead>";
            // Beide linken Spalten.
            html += "  <tbody>";
            var cust = 0;
            for (var i = 0; i < bookmarks.length; i++) {
                var num = bookmarks[i]['number'];
                html += "<tr>";
                // Erste linke Spalte mit möglichen BMs:
                html += "  <td style='width: 202px; z-index: 1004;' align='left' class='gclh_LinkListElement' id='gclh_LinkListElement_" + num + "' >";
                html += "    <img style='height: 12px; margin-right: 3px; cursor: grab;' title='' src='"+global_grab_it2_icon+"' />";
                if (typeof(bookmarks[i]['custom']) != "undefined" && bookmarks[i]['custom'] == true) {
                    html += "<input style='padding-left: 2px !important; padding-right: 2px !important;' class='gclh_form' type='text' title='Custom link' id='settings_custom_bookmark[" + cust + "]' value='" + bookmarks[i]['href'] + "' size='15'> ";
                    html += "<input type='checkbox' style='margin-left: 1px;' title='Open in new window' " + (bookmarks[i]['target'] == "_blank" ? "checked='checked'" : "" ) + " id='settings_custom_bookmark_target[" + cust + "]'>";
                    cust++;
                } else {
                    html += "<a class='gclh_ref' title='Standard link with description' ";
                    for (attr in bookmarks[i]) {
                        if (attr != "title") {
                            html +=      attr + "='" + bookmarks[i][attr] + "' ";
                        }
                    }
                    var outTitle = (typeof(bookmarks_orig_title[num]) != "undefined" && bookmarks_orig_title[num] != "" ? bookmarks_orig_title[num] : bookmarks[i]['title']);
                    html += ">" + outTitle + "</a>";
                    if (num >= 69 && num <= 69) html += newParameterLL2;
                    if (num >= 70 && num <= 74 || num == 25) html += newParameterLL3;
                    if (num >= 75 && num <= 76) html += newParameterLL1;
                }
                html += "  </td>";
                // Zweite linke Spalte mit abweichenden Bezeichnungen:
                html += "  <td align='left' style='padding: 0px 2px 1px 2px;'>";
                if (typeof(bookmarks[i]['custom']) != "undefined" && bookmarks[i]['custom'] == true) {
                    html += "<input style='padding-left: 2px !important; padding-right: 2px !important;' class='gclh_form' title='Description for custom link' id='bookmarks_name[" + num + "]' type='text' size='15' value='" + getValue("settings_bookmarks_title[" + num + "]", "") + "'>";
                } else {
                    html += "<input style='padding-left: 2px !important; padding-right: 2px !important;' class='gclh_form' title='Differing description for standard link' id='bookmarks_name[" + num + "]' type='text' size='15' value='" + getValue("settings_bookmarks_title[" + num + "]", "") + "'>";
                    if (num >= 69 && num <= 69) html += newParameterLLVersionSetzen(0.8);
                    if (num >= 70 && num <= 74 || num == 25) html += newParameterLLVersionSetzen(0.9);
                    if (num >= 75 && num <= 76) html += newParameterLLVersionSetzen("0.10");
                }
                html += "  </td></tr>";
            }
            html += "  </tbody>";
            html += "</table>";
            html += "</div>";

            // section Development
            html += "<h4 class='gclh_headline2'>"+prepareHideable.replace("#name#","development")+"Development</h4>";
            html += "<div id='gclh_config_development' class='gclh_block'>";
            html += newParameterOn3;
            html += checkboxy('settings_gclherror_alert', 'Show an alert if an internal error occurs') + show_help("Show an alert on the top of the page, if gclh_error() is called.") + "<br>";
            html += newParameterVersionSetzen(0.9) + newParameterOff;
            html += "</div>";

            // footer
            html += "<br><br>";
            html += "&nbsp;" + "<input class='gclh_form' type='button' value='" + setValueInSaveButton() + "' id='btn_save'> <input class='gclh_form' type='button' value='save & upload' id='btn_saveAndUpload'> <input class='gclh_form' type='button' value='" + setValueInCloseButton() + "' id='btn_close2'>";
            html += "<br><div align='right' class='gclh_small' style='float: right; padding-top: 5px;'>License: <a href='"+urlDocu+"license.md#readme' target='_blank' title='GNU General Public License Version 2'>GPLv2</a> | Warranty: <a href='"+urlDocu+"warranty.md#readme' target='_blank' title='GC little helper II comes with ABSOLUTELY NO WARRANTY'>NO</a></div><br>";
            var end = (new Date()).getFullYear();
            html += "<div align='right' class='gclh_small' style='float: right;'>Copyright © 2010-2016 <a href='/profile/?u=Torsten-' target='_blank' title='GC profile for Torsten-'>Torsten Amshove</a>, 2016-"+end+" <a href='/profile/?u=2Abendsegler' target='_blank' title='GC profile for 2Abendsegler'>2Abendsegler</a>, 2017-"+end+" <a href='/profile/?u=Ruko2010' target='_blank' title='GC profile for Ruko2010'>Ruko2010</a></div>";
            html += "</div></div>";

            // Config Content: Aufbauen, Reset Area verbergen, Special Links Nearest List/Map, Own Trackables versorgen.
            // ---------------
            div.innerHTML = html;
            $('body')[0].appendChild(div);
            $('#gclh_config_content2').hide();
            $('#gclh_config_content_thanks').hide();
            $('#settings_show_homezone,#settings_use_gclh_layercontrol,#settings_bookmarks_top_menu,#settings_bookmarks_top_menu_h').addClass('shadowBig');
            setSpecialLinks();

            // Config Content: Hauptbereiche hideable machen.
            // ---------------
            function makeConfigAreaHideable(configArea) {
                if (document.getElementById("lnk_gclh_config_" + configArea)) {
                    showHideBoxCL("lnk_gclh_config_" + configArea, true);
                    document.getElementById("lnk_gclh_config_" + configArea).addEventListener("click", function() {showHideBoxCL(this.id, false);}, false);
                    // Show, hide all areas in config with one click with the right mouse.
                    document.getElementById("lnk_gclh_config_" + configArea).oncontextmenu = function(){return false;};
                    $('#lnk_gclh_config_' + configArea).bind('contextmenu.new', function() {showHideConfigAll(this.id, false);});
                }
            }
            // Anfangsbestand, Events setzen.
            if (settings_make_config_main_areas_hideable && !document.location.href.match(/#a#/i)) {
                makeConfigAreaHideable("global");
                makeConfigAreaHideable("config");
                makeConfigAreaHideable("nearestlist");
                makeConfigAreaHideable("pq");
                makeConfigAreaHideable("bm");
                makeConfigAreaHideable("recview");
                makeConfigAreaHideable("friends");
                makeConfigAreaHideable("hide");
                makeConfigAreaHideable("others");
                makeConfigAreaHideable("maps");
                makeConfigAreaHideable("profile");
                makeConfigAreaHideable("db");
                makeConfigAreaHideable("listing");
                makeConfigAreaHideable("logging");
                makeConfigAreaHideable("mail");
                makeConfigAreaHideable("linklist");
                makeConfigAreaHideable("development");
            }

            // Linklist: Events, Anfangsbestand aufbauen.
            // ---------
            for (var i = 0; i < bookmarks.length; i++) {
                // Input Events aufbauen, Spalte 2, abweichende Bezeichnungen.
                document.getElementById('bookmarks_name[' + i + ']').addEventListener("input", updateByInputDescription, false);
                // Anfangsbestand aufbauen. Prüfen, ob BM in Linklist. Cursor, Opacity entsprechend setzen.
                if (document.getElementById('gclh_LinkListTop_' + i)) {
                    flagBmInLl(document.getElementById('gclh_LinkListElement_' + i), false, "not-allowed", "0.4", "Already available in Linklist");
                } else {
                    flagBmInLl(document.getElementById('gclh_LinkListElement_' + i), false, "grab", "1", "Grab it");
                }
            }
            var elem = document.getElementsByClassName('gclh_LinkListInlist');
            for (var i = 0; i < elem.length; i++) {
                // Mousedown, Mouseup Events aufbauen, rechte Spalte, Move Icon und Bezeichnung.(Nicht Delete Icon.)
                elem[i].children[0].children[0].addEventListener("mousedown", function(event){changeAttrMouse(event, this, "move");}, false); // Move Icon
                elem[i].children[0].addEventListener("mousedown", function(event){changeAttrMouse(event, this, "desc");}, false);             // Description
                elem[i].children[0].children[0].addEventListener("mouseup", function(event){changeAttrMouse(event, this, "move");}, false);   // Move Icon
                elem[i].children[0].addEventListener("mouseup", function(event){changeAttrMouse(event, this, "desc");}, false);               // Description
            }

            // Linklist: Delete Icon rechte Spalte.
            // ---------
            $(".gclh_LinkListDelIcon").click(function() {
                var row = this.parentNode.parentNode;
                var tablebody = row.parentNode;
                $(row).remove();
                if (tablebody.children.length == 0) $('<tr class="gclh_LinkListPlaceHolder"><td>Drop here...</td></tr>').appendTo(tablebody);
                // BM als nicht vorhanden in Linklist kennzeichnen.
                var index = this.parentNode.parentNode.id.replace("gclh_LinkListTop_", "");
                flagBmInLl(document.getElementById("gclh_LinkListElement_" + index), false, "grab", "1", "Grab it");
            });

            // Linklist: Drag and Drop von linker Spalte in rechte Spalte und sortieren in rechter Spalte.
            // ---------
            $(".gclh_LinkListElement").draggable({
                revert: "invalid",
                helper: "clone",
                start: function(event, ui) {
                    $(ui.helper).addClass("gclh_form");
                },
                stop: function(event, ui) {
                    $(ui.helper).removeClass("gclh_form");
                }
            });

            $("#gclh_LinkListTop").droppable({
                accept: function(d) {
                    if (!d.hasClass("gclh_LinkListInlist") && d.hasClass("gclh_LinkListElement")) {
                        // Wenn dragging stattfindet, Cursor und Opacity passend setzen.
                        if ($('.gclh_LinkListElement.ui-draggable-dragging').length != 0) {
                            var index = d[0].id.replace("gclh_LinkListElement_", "");
                            if (document.getElementById("gclh_LinkListTop_" + index)) {
                                flagBmInLl(d[0].parentNode.children[2], true, "not-allowed", "1", "");
                            } else {
                                flagBmInLl(d[0].parentNode.children[2], true, "grabbing", "1", "");
                                return true;
                            }
                        }
                    }
                },
                drop: function(event, ui) {
                    // Platzhalter entfernen.
                    $(this).find(".gclh_LinkListPlaceHolder").remove();
                    // Index ermitteln.
                    var index = ui.draggable[0].id.replace("gclh_LinkListElement_", "");
                    // Custom BM?
                    if (ui.draggable[0].children[1].id.match("custom")) {
                        var textTitle = "Custom" + ui.draggable[0].children[1].id.replace("settings_custom_bookmark[", "").replace("]", "");
                    } else var textTitle = ui.draggable[0].children[1].innerHTML;
                    // Abweichende Bezeichnung ermitteln. Falls leer, default nehmen.
                    var text = document.getElementById("bookmarks_name["+index+"]").value;
                    if (!text.match(/(\S+)/)) text = textTitle;
                    var textName = textTitle;
                    // BM in Linklist aufbauen.
                    var htmlRight = "";
                    htmlRight += "<td style='vertical-align: top; text-overflow: ellipsis; max-width: 166px; overflow: hidden; white-space: nowrap;'>";
                    htmlRight += "  <img style='height: 12px; margin-right: 3px; cursor: grab;' title ='Grab it' src='"+global_grab_it_icon+"' />";
                    htmlRight +=    text;
                    htmlRight += "</td>";
                    htmlRight += "<td>";
                    htmlRight += " <img class='gclh_LinkListDelIcon' style='height: 20px; margin-left: 0px; vertical-align: top; cursor: pointer;' title ='Delete it' src='" + global_del_it_icon + "' />";
                    htmlRight += "</td>";
                    var row = $("<tr style='height: 25px;' class='gclh_LinkListInlist' id='gclh_LinkListTop_" + index + "' name='" + textName + "' title='" + textTitle + "'></tr>").html(htmlRight);
                    // Entsprechende Bookmark als vorhanden in Linklist kennzeichnen.
                    flagBmInLl(document.getElementById("gclh_LinkListElement_" + index), false, "not-allowed", "0.4", "Already available in Linklist");
                    // Click Event für Delete Icon aufbauen.
                    row.find(".gclh_LinkListDelIcon").click(function() {
                        var row = this.parentNode.parentNode;
                        var tablebody = row.parentNode;
                        $(row).remove();
                        if (tablebody.children.length == 0) $('<tr class="gclh_LinkListPlaceHolder"><td>Drop here...</td></tr>').appendTo(tablebody);
                    });
                    $(row).appendTo(this);
                }
            }).sortable({
                items: "tr:not(.gclh_LinkListPlaceHolder)"
            });

            // Map / Layers:
            // -------------
            function layerOption(name, selected) {
                return "<option value='" + name + "' " + (selected ? "selected='selected'" : "") + ">" + name + "</option>";
            }
            $("#btn_map_layer_right").click(function() {
                var source = "#settings_maplayers_unavailable";
                var destination = "#settings_maplayers_available";
                $(source+" option:selected").each(function() {
                    var name = $(this).html();
                    if (name == settings_map_default_layer) $("#settings_mapdefault_layer").html(name);
                    $(destination).append(layerOption(name, (settings_map_default_layer == name)));
                });
                $(source+" option:selected").remove();
            });
            $("#btn_map_layer_left").click(function() {
                var source = "#settings_maplayers_available";
                var destination = "#settings_maplayers_unavailable";
                $(source+" option:selected").each(function() {
                    var name = $(this).html();
                    if (name == settings_map_default_layer) {
                        $("#settings_mapdefault_layer").html("<i>not available</i>");
                        settings_map_default_layer = "";
                    }
                    $(destination).append(layerOption(name, false));
                });
                $(source+" option:selected").remove();
            });
            $("#btn_set_default_layer").click(function() {
                $("#settings_maplayers_available option:selected").each(function() {
                    var name = $(this).html();
                    $("#settings_mapdefault_layer").html(name);
                    settings_map_default_layer = name;
                });
            });
            // Fill layer lists.
            var layerListAvailable="";
            var layerListUnAvailable="";

            // Wenn bisher keine Layer ausgewählt, alle auswählen.
            if (settings_map_layers == "" || settings_map_layers.length < 1) {
                for (name in all_map_layers) {
                    $("#settings_maplayers_available").append(layerOption(name, (settings_map_default_layer == name)));
                }
            } else {
                for (name in all_map_layers) {
                    if (settings_map_layers.indexOf(name) != -1) $("#settings_maplayers_available").append(layerOption(name, (settings_map_default_layer == name)));
                    else $("#settings_maplayers_unavailable").append(layerOption(name, false));
                }
            }
            // Show/Hide Einstellungen zu Layers in Map.
            $("#settings_use_gclh_layercontrol").click(function() {
                $("#MapLayersConfiguration").toggle();
            });

            // Colorpicker:
            // ------------
            var code = GM_getResourceText("jscolor");
            code += 'new jscolor.init();';
            injectPageScript(code, "body");

            // Multi-Homezone:
            // ---------------
            function gclh_init_multi_homecoord_remove_listener($el) {
                $el.find('.remove').click(function() {
                    $(this).closest('.multi_homezone_element').remove();
                });
            }
            // Initialize remove listener for present elements.
            gclh_init_multi_homecoord_remove_listener($('.multi_homezone_settings'));
            // Initialize add listener for multi homecoord entries.
            $('.multi_homezone_settings .addentry').click(function() {
                var $newEl = $(hztp);
                $('.multi_homezone_settings tbody').append($newEl);
                // Initialize remove listener for new element.
                gclh_init_multi_homecoord_remove_listener($newEl);
                // Reinit jscolor.
                if (typeof(chrome) != "undefined") {
                    $('.gclh_form.color:not(.withPicker)').each(function(i, e) {
                        var homezonepic = new jscolor.color(e, {
                            required: true,
                            adjust: true,
                            hash: true,
                            caps: true,
                            pickerMode: 'HSV',
                            pickerPosition: 'right'
                        });
                        $(e).addClass("withPicker");
                    });
                } else injectPageScript('new jscolor.init();', "body");
            });
            // Show/Hide Einstellungen zu Homezone circels.
            $("#settings_show_homezone").click(function() {
                $("#ShowHomezoneCircles").toggle();
            });

            // Rest:
            // -----
            function gclh_show_linklist() {
                if (document.getElementById('lnk_gclh_config_linklist').title == "show") document.getElementById('lnk_gclh_config_linklist').click();
            }

            $('#check_for_upgrade')[0].addEventListener("click", function() {checkForUpgrade(true);}, false);
            $('#rc_link')[0].addEventListener("click", rcPrepare, false);
            $('#rc_reset_button')[0].addEventListener("click", rcReset, false);
            $('#rc_close_button')[0].addEventListener("click", rcClose, false);
            $('#thanks_link')[0].addEventListener("click", thanksShow, false);
            $('#thanks_close_button')[0].addEventListener("click", gclh_showConfig, false);
            $('#gclh_linklist_link_1')[0].addEventListener("click", gclh_show_linklist, false);
            $('#gclh_linklist_link_2')[0].addEventListener("click", gclh_show_linklist, false);
            $('#btn_close2')[0].addEventListener("click", btnClose, false);
            $('#btn_save')[0].addEventListener("click", function() {btnSave("normal");}, false);
            $('#btn_saveAndUpload')[0].addEventListener("click", function() {btnSave("upload");}, false);
            $('#settings_bookmarks_on_top')[0].addEventListener("click", handleRadioTopMenu, false);
            $('#settings_bookmarks_top_menu')[0].addEventListener("click", handleRadioTopMenu, false);
            $('#settings_bookmarks_top_menu_h')[0].addEventListener("click", handleRadioTopMenu, false);
            handleRadioTopMenu(true);
            $('#settings_load_logs_with_gclh')[0].addEventListener("click", alert_settings_load_logs_with_gclh, false);
            $('#restore_settings_lines_color_zebra')[0].addEventListener("click", restoreField, false);
            $('#restore_settings_lines_color_user')[0].addEventListener("click", restoreField, false);
            $('#restore_settings_lines_color_owner')[0].addEventListener("click", restoreField, false);
            $('#restore_settings_lines_color_reviewer')[0].addEventListener("click", restoreField, false);
            $('#restore_settings_lines_color_vip')[0].addEventListener("click", restoreField, false);
            $('#restore_settings_font_color_menu')[0].addEventListener("click", restoreField, false);
            $('#restore_settings_font_color_menuX0')[0].addEventListener("click", restoreField, false);
            $('#restore_settings_font_color_submenu')[0].addEventListener("click", restoreField, false);
            $('#restore_settings_font_color_submenuX0')[0].addEventListener("click", restoreField, false);
            $('#restore_settings_count_own_matrix_show_color_next')[0].addEventListener("click", restoreField, false);
            $('#settings_process_vup')[0].addEventListener("click", alert_settings_process_vup, false);
            $('#restore_settings_lists_disabled_color')[0].addEventListener("click", restoreField, false);
            $('#restore_settings_lists_archived_color')[0].addEventListener("click", restoreField, false);

            // Events setzen für Parameter, die im GClh Config mehrfach ausgegeben wurden, weil sie zu mehreren Themen gehören. Es handelt sich hier um den Parameter selbst.
            // In der Function werden Events für den Parameter selbst (ZB: "settings_show_mail_in_viplist") und dessen Clone gesetzt, die hinten mit "X" und Nummerierung
            // von 0-9 enden können (ZB: "settings_show_mail_in_viplistX0").
            setEvForDouPara("settings_show_mail_in_viplist", "click");
            setEvForDouPara("settings_log_inline_tb", "click");
            setEvForDouPara("settings_font_color_menu", "input");
            setEvForDouPara("settings_font_color_menu", "change");
            setEvForDouPara("settings_font_color_submenu", "input");
            setEvForDouPara("settings_font_color_submenu", "change");
            setEvForDouPara("settings_font_size_menu", "input");
            setEvForDouPara("settings_distance_menu", "input");
            setEvForDouPara("settings_font_size_submenu", "input");
            setEvForDouPara("settings_distance_submenu", "input");
            setEvForDouPara("settings_show_log_it", "click");
            setEvForDouPara("settings_logit_for_basic_in_pmo", "click");
            setEvForDouPara("settings_show_thumbnails", "click");
            setEvForDouPara("settings_hover_image_max_size", "input");
            setEvForDouPara("settings_imgcaption_on_top", "click");
            setEvForDouPara("settings_submit_log_button", "click");

            // Events setzen für Parameter, die im GClh Config eine Abhängigkeit derart auslösen, dass andere Parameter aktiviert bzw. deaktiviert werden müssen.
            // ZB. können Mail Icons in VIP List (Parameter "settings_show_mail_in_viplist") nur aufgebaut werden, wenn Mail Icons überhaupt erzeugt werden (Parameter
            // "settings_show_mail"). Clone auch berücksichtigen.
            setEvForDepPara("settings_change_header_layout", "settings_show_smaller_gc_link");
            setEvForDepPara("settings_change_header_layout", "settings_remove_logo");
            setEvForDepPara("settings_show_smaller_gc_link", "settings_remove_logo");
            setEvForDepPara("settings_change_header_layout", "settings_remove_message_in_header");
            setEvForDepPara("settings_change_header_layout", "settings_gc_tour_is_working");
            setEvForDepPara("settings_change_header_layout", "settings_fixed_header_layout");
            setEvForDepPara("settings_change_header_layout", "settings_font_color_menu");
            setEvForDepPara("settings_change_header_layout", "restore_settings_font_color_menu");
            setEvForDepPara("settings_change_header_layout", "settings_font_color_submenu");
            setEvForDepPara("settings_change_header_layout", "restore_settings_font_color_submenu");
            setEvForDepPara("settings_change_header_layout", "settings_bookmarks_top_menu_h");
            setEvForDepPara("settings_change_header_layout", "settings_menu_float_right");
            setEvForDepPara("settings_change_header_layout", "settings_font_size_menu");
            setEvForDepPara("settings_change_header_layout", "settings_distance_menu");
            setEvForDepPara("settings_change_header_layout", "settings_font_size_submenu");
            setEvForDepPara("settings_change_header_layout", "settings_distance_submenu");
            setEvForDepPara("settings_change_header_layout", "settings_menu_number_of_lines");
            setEvForDepPara("settings_change_header_layout", "settings_menu_show_separator");
            setEvForDepPara("settings_bookmarks_on_top", "settings_bookmarks_top_menu_h");
            setEvForDepPara("settings_bookmarks_on_top", "settings_bookmarks_search");
            setEvForDepPara("settings_bookmarks_on_top", "settings_bookmarks_search_default");
            setEvForDepPara("settings_bookmarks_on_top", "settings_menu_float_right");
            setEvForDepPara("settings_bookmarks_on_top", "settings_menu_number_of_lines");
            setEvForDepPara("settings_bookmarks_on_top", "settings_menu_show_separator");
            setEvForDepPara("settings_load_logs_with_gclh", "settings_show_mail_in_viplist");
            setEvForDepPara("settings_load_logs_with_gclh", "settings_show_cache_listings_in_zebra");
            setEvForDepPara("settings_load_logs_with_gclh", "settings_show_cache_listings_color_user");
            setEvForDepPara("settings_load_logs_with_gclh", "settings_show_cache_listings_color_owner");
            setEvForDepPara("settings_load_logs_with_gclh", "settings_show_cache_listings_color_reviewer");
            setEvForDepPara("settings_load_logs_with_gclh", "settings_show_cache_listings_color_vip");
            setEvForDepPara("settings_show_vip_list", "settings_show_cache_listings_color_vip");
            setEvForDepPara("settings_show_vip_list", "settings_show_tb_listings_color_vip");
            setEvForDepPara("settings_show_vip_list", "settings_lines_color_vip");
            setEvForDepPara("settings_show_vip_list", "restore_settings_lines_color_vip");
            setEvForDepPara("settings_show_vip_list", "settings_show_owner_vip_list");
            setEvForDepPara("settings_show_vip_list", "settings_show_long_vip");
            setEvForDepPara("settings_show_vip_list", "settings_vip_show_nofound");
            setEvForDepPara("settings_show_vip_list", "settings_show_mail_in_viplist");
            setEvForDepPara("settings_show_vip_list", "settings_show_mail_in_allmyvips");
            setEvForDepPara("settings_show_vip_list", "settings_make_vip_lists_hideable");
            setEvForDepPara("settings_show_vip_list", "settings_process_vup");
            setEvForDepPara("settings_show_vip_list", "settings_show_vup_friends");
            setEvForDepPara("settings_show_vip_list", "settings_vup_hide_avatar");
            setEvForDepPara("settings_show_vip_list", "settings_vup_hide_log");
            setEvForDepPara("settings_process_vup", "settings_show_vup_friends");
            setEvForDepPara("settings_process_vup", "settings_vup_hide_avatar");
            setEvForDepPara("settings_process_vup", "settings_vup_hide_log");
            setEvForDepPara("settings_vup_hide_avatar", "settings_vup_hide_log");
            setEvForDepPara("settings_log_inline", "settings_log_inline_tb", false);
            setEvForDepPara("settings_log_inline_pmo4basic", "settings_log_inline_tb", false);
            setEvForDepPara("settings_show_mail", "settings_show_mail_in_viplist");
            setEvForDepPara("settings_show_mail", "settings_show_mail_in_allmyvips");
            setEvForDepPara("settings_show_mail", "settings_mail_icon_new_win");
            setEvForDepPara("settings_show_message", "settings_message_icon_new_win");
            setEvForDepPara("settings_show_thumbnails", "settings_hover_image_max_size");
            setEvForDepPara("settings_show_thumbnails", "settings_spoiler_strings");
            setEvForDepPara("settings_show_thumbnails", "settings_imgcaption_on_top");
            setEvForDepPara("settings_show_thumbnailsX0", "settings_hover_image_max_size");
            setEvForDepPara("settings_show_thumbnailsX0", "settings_spoiler_strings");
            setEvForDepPara("settings_show_thumbnailsX0", "settings_imgcaption_on_top");
            setEvForDepPara("settings_map_overview_build", "settings_map_overview_zoom");
            setEvForDepPara("settings_map_overview_build", "settings_map_overview_layer");
            setEvForDepPara("settings_count_own_matrix_show_next", "settings_count_own_matrix_show_count_next");
            setEvForDepPara("settings_count_own_matrix_show_next", "settings_count_own_matrix_show_color_next");
            setEvForDepPara("settings_count_own_matrix_show_next", "restore_settings_count_own_matrix_show_color_next");
            setEvForDepPara("settings_count_own_matrix_show_next", "settings_count_own_matrix_links_radius");
            setEvForDepPara("settings_count_own_matrix_show_next", "settings_count_own_matrix_links");
            setEvForDepPara("settings_add_link_gc_map_on_google_maps", "settings_switch_to_gc_map_in_same_tab");
            setEvForDepPara("settings_add_link_google_maps_on_gc_map", "settings_switch_to_google_maps_in_same_tab");
            setEvForDepPara("settings_add_link_gc_map_on_osm", "settings_switch_from_osm_to_gc_map_in_same_tab");
            setEvForDepPara("settings_add_link_osm_on_gc_map", "settings_switch_to_osm_in_same_tab");
            setEvForDepPara("settings_add_link_flopps_on_gc_map", "settings_switch_to_flopps_in_same_tab");
            setEvForDepPara("settings_add_link_geohack_on_gc_map", "settings_switch_to_geohack_in_same_tab");
            setEvForDepPara("settings_show_latest_logs_symbols", "settings_show_latest_logs_symbols_count");
            setEvForDepPara("settings_load_logs_with_gclh", "settings_show_latest_logs_symbols");
            setEvForDepPara("settings_log_statistic", "settings_log_statistic_reload");
            setEvForDepPara("settings_log_statistic", "settings_log_statistic_percentage");
            setEvForDepPara("settings_friendlist_summary", "settings_friendlist_summary_viponly");
            setEvForDepPara("settings_remove_banner", "settings_remove_banner_for_garminexpress");
            setEvForDepPara("settings_remove_banner", "settings_remove_banner_blue");
            setEvForDepPara("settings_driving_direction_link", "settings_driving_direction_parking_area");
            setEvForDepPara("settings_improve_add_to_list", "settings_improve_add_to_list_height");
            setEvForDepPara("settings_set_default_langu", "settings_default_langu");
            setEvForDepPara("settings_pq_set_cachestotal", "settings_pq_cachestotal");
            setEvForDepPara("settings_pq_set_difficulty", "settings_pq_difficulty");
            setEvForDepPara("settings_pq_set_difficulty", "settings_pq_difficulty_score");
            setEvForDepPara("settings_pq_set_terrain", "settings_pq_terrain");
            setEvForDepPara("settings_pq_set_terrain", "settings_pq_terrain_score");
            setEvForDepPara("settings_pq_previewmap", "settings_pq_previewmap_layer");
            setEvForDepPara("settings_show_all_logs", "settings_show_all_logs_count");
            setEvForDepPara("settings_strike_archived", "settings_highlight_usercoords");
            setEvForDepPara("settings_strike_archived", "settings_highlight_usercoords_bb");
            setEvForDepPara("settings_strike_archived", "settings_highlight_usercoords_it");
            setEvForDepPara("settings_but_search_map", "settings_but_search_map_new_tab");
            setEvForDepPara("settings_compact_layout_nearest", "settings_fav_proz_nearest");
            setEvForDepPara("settings_compact_layout_pqs", "settings_fav_proz_pqs");
            setEvForDepPara("settings_compact_layout_recviewed", "settings_fav_proz_recviewed");
            setEvForDepPara("settings_show_elevation_of_waypoints","settings_primary_elevation_service");
            setEvForDepPara("settings_show_elevation_of_waypoints","settings_secondary_elevation_service");
            setEvForDepPara("settings_show_gpsvisualizer_link","settings_show_gpsvisualizer_gcsymbols");
            setEvForDepPara("settings_show_gpsvisualizer_link","settings_show_gpsvisualizer_typedesc");
            setEvForDepPara("settings_show_openrouteservice_link","settings_show_openrouteservice_home");
            setEvForDepPara("settings_show_openrouteservice_link","settings_show_openrouteservice_medium");
            setEvForDepPara("settings_show_log_counter_but","settings_show_log_counter");
            setEvForDepPara("settings_show_remove_ignoring_link","settings_use_one_click_ignoring");
            setEvForDepPara("settings_set_compactLayoutUnpublishedHides_sort","settings_compactLayoutUnpublishedHides_sort");
            setEvForDepPara("settings_set_showUnpublishedHides_sort","settings_showUnpublishedHides_sort");
            setEvForDepPara("settings_showUnpublishedHides","settings_set_showUnpublishedHides_sort");
            setEvForDepPara("settings_showUnpublishedHides","settings_showUnpublishedHides_sort");
            setEvForDepPara("settings_lists_disabled","settings_lists_disabled_color");
            setEvForDepPara("settings_lists_disabled","restore_settings_lists_disabled_color");
            setEvForDepPara("settings_lists_disabled","settings_lists_disabled_strikethrough");
            setEvForDepPara("settings_lists_archived","settings_lists_archived_color");
            setEvForDepPara("settings_lists_archived","restore_settings_lists_archived_color");
            setEvForDepPara("settings_lists_archived","settings_lists_archived_strikethrough");
            setEvForDepPara("settings_lists_icons_visible","settings_lists_log_status_icons_visible");
            setEvForDepPara("settings_lists_icons_visible","settings_lists_cache_type_icons_visible");
            // Abhängigkeiten der Linklist Parameter.
            for (var i = 0; i < 100; i++) {
                // 2. Spalte: Links für Custom BMs.
                if (document.getElementById("gclh_LinkListElement_" + i)) {
                    setEvForDepPara("settings_bookmarks_on_top", "gclh_LinkListElement_" + i, false);
                    setEvForDepPara("settings_bookmarks_show", "gclh_LinkListElement_" + i, false);
                }
                if (document.getElementById("settings_custom_bookmark[" + i + "]")) {
                    setEvForDepPara("settings_bookmarks_on_top", "settings_custom_bookmark[" + i + "]", false);
                    setEvForDepPara("settings_bookmarks_show", "settings_custom_bookmark[" + i + "]", false);
                }
                // 3. Spalte: Target für Links für Custom BMs.
                if (document.getElementById("settings_custom_bookmark_target[" + i + "]")) {
                    setEvForDepPara("settings_bookmarks_on_top", "settings_custom_bookmark_target[" + i + "]", false);
                    setEvForDepPara("settings_bookmarks_show", "settings_custom_bookmark_target[" + i + "]", false);
                }
                // 4. Spalte: Bezeichnungen.
                if (document.getElementById("bookmarks_name[" + i + "]")) {
                    setEvForDepPara("settings_bookmarks_on_top", "bookmarks_name[" + i + "]", false);
                    setEvForDepPara("settings_bookmarks_show", "bookmarks_name[" + i + "]", false);
                } else break;
            }
            // 5. Spalte: Linklist.
            setEvForDepPara("settings_bookmarks_on_top", "gclh_LinkListTop", false);
            setEvForDepPara("settings_bookmarks_show", "gclh_LinkListTop", false);
            // Anfangsbesetzung herstellen bei Abhängigkeiten.
            setStartForDepPara();

            // Save, Close Buttons dynamisch mit F2 bzw. ESC Beschriftung versehen.
            $('#settings_f2_save_gclh_config')[0].addEventListener("click", setValueInSaveButton, false);
            $('#settings_esc_close_gclh_config')[0].addEventListener("click", setValueInCloseButton, false);

            // Positionierung innerhalb des GClh Config bei Aufrufen.
            if (document.location.href.match(/#a#/i)) {
                document.location.href = document.location.href.replace(/#a#/i, "#");
                var diff = 4;
                if (document.location.href.match(/#llb#/i)) {
                    if (document.getElementById('settings_bookmarks_top_menu').checked) diff += 141 - 6;
                    else diff += 165 - 25;
                }
                if (document.location.href.match(/#(ll|llb)#/i)) {
                    document.location.href = document.location.href.replace(/#(ll|llb)#/i, "#");
                    gclh_show_linklist();
                }
                if (document.location.href.match(/#(\S+)/)) {
                    var arg = document.location.href.match(/#(.*)/);
                    if (arg) {
                        document.location.href = clearUrlAppendix(document.location.href, false);
                        $('html,body').animate({scrollTop: ($('#'+arg[1]).offset().top) - diff}, 1500, "swing");
                    }
                }
            }
        }
        if ($('.hover.open')[0]) $('.hover.open')[0].className = "";

        // Bei F2 Save, bei ESC Close im Config durchführen.
        if (check_config_page()) window.addEventListener('keydown', keydown, true);
        function keydown(e) {
            if (check_config_page()) {
                if ($('#settings_f2_save_gclh_config')[0].checked && !global_mod_reset) {
                    if (e.keyCode == 113 && noSpecialKey(e)) $('#btn_save')[0].click();
                }
                if ($('#settings_esc_close_gclh_config')[0].checked && !global_mod_reset) {
                    if (e.keyCode == 27 && noSpecialKey(e)) $('#btn_close2')[0].click();
                }
            }
        }

        // Save Button.
        function btnSave(type) {
            window.scroll(0, 0);
            $("#settings_overlay").fadeOut(400);
            document.location.href = clearUrlAppendix(document.location.href, false);
            if ($('#settings_show_save_message')[0].checked) showSaveForm();
            var settings = {};

            function setValue(key, value) {settings[key] = value;}

            var value = document.getElementById("settings_home_lat_lng").value;
            var latlng = toDec(value);
            if (latlng) {
                if (getValue("home_lat", 0) != parseInt(latlng[0] * 10000000)) setValue("home_lat", parseInt(latlng[0] * 10000000));  // * 10000000 because GM don't know float.
                if (getValue("home_lng", 0) != parseInt(latlng[1] * 10000000)) setValue("home_lng", parseInt(latlng[1] * 10000000));
            }
            setValue("settings_bookmarks_search_default", document.getElementById('settings_bookmarks_search_default').value);
            setValue("settings_show_all_logs_count", document.getElementById('settings_show_all_logs_count').value);

            // Homezone circle.
            setValue("settings_homezone_radius", document.getElementById('settings_homezone_radius').value);
            setValue("settings_homezone_color", document.getElementById('settings_homezone_color').value.replace("#",""));
            if (document.getElementById('settings_homezone_opacity').value <= 100 && document.getElementById('settings_homezone_opacity').value >= 0) setValue("settings_homezone_opacity", document.getElementById('settings_homezone_opacity').value);
            // Multi Homezone circles.
            var settings_multi_homezone = {};
            var $hzelements = $('.multi_homezone_element');
            for (var i = 0; i < $hzelements.length; i++) {
                var $curEl = $hzelements.eq(i);
                settings_multi_homezone[i] = {};
                var latlng = toDec($curEl.find('.coords:eq(0)').val());
                settings_multi_homezone[i].lat = parseInt(latlng[0] * 10000000);
                settings_multi_homezone[i].lng = parseInt(latlng[1] * 10000000);
                settings_multi_homezone[i].radius = $curEl.find('.radius:eq(0)').val();
                settings_multi_homezone[i].color = $curEl.find('.color:eq(0)').val().replace("#","");
                settings_multi_homezone[i].opacity = $curEl.find('.opacity:eq(0)').val();
            }
            setValue("settings_multi_homezone", JSON.stringify(settings_multi_homezone));

            setValue("settings_new_width", document.getElementById('settings_new_width').value);
            setValue("settings_default_logtype", document.getElementById('settings_default_logtype').value);
            setValue("settings_default_logtype_event", document.getElementById('settings_default_logtype_event').value);
            setValue("settings_default_logtype_owner", document.getElementById('settings_default_logtype_owner').value);
            setValue("settings_default_tb_logtype", document.getElementById('settings_default_tb_logtype').value);
            setValue("settings_mail_signature", document.getElementById('settings_mail_signature').value.replace(/‌/g, ""));  // Entfernt Steuerzeichen.
            setValue("settings_log_signature", document.getElementById('settings_log_signature').value.replace(/‌/g, ""));
            setValue("settings_tb_signature", document.getElementById('settings_tb_signature').value.replace(/‌/g, ""));
            setValue("settings_map_default_layer", settings_map_default_layer);
            setValue("settings_hover_image_max_size", document.getElementById('settings_hover_image_max_size').value);
            setValue("settings_spoiler_strings", document.getElementById('settings_spoiler_strings').value);
            setValue("settings_font_size_menu", document.getElementById('settings_font_size_menu').value);
            setValue("settings_font_size_submenu", document.getElementById('settings_font_size_submenu').value);
            setValue("settings_distance_menu", document.getElementById('settings_distance_menu').value);
            setValue("settings_distance_submenu", document.getElementById('settings_distance_submenu').value);
            setValue("settings_font_color_menu", document.getElementById('settings_font_color_menu').value.replace("#",""));
            setValue("settings_font_color_submenu", document.getElementById('settings_font_color_submenu').value.replace("#",""));
            setValue("settings_menu_number_of_lines", document.getElementById('settings_menu_number_of_lines').value);
            setValue("settings_lines_color_zebra", document.getElementById('settings_lines_color_zebra').value.replace("#",""));
            setValue("settings_lines_color_user", document.getElementById('settings_lines_color_user').value.replace("#",""));
            setValue("settings_lines_color_owner", document.getElementById('settings_lines_color_owner').value.replace("#",""));
            setValue("settings_lines_color_reviewer", document.getElementById('settings_lines_color_reviewer').value.replace("#",""));
            setValue("settings_lines_color_vip", document.getElementById('settings_lines_color_vip').value.replace("#",""));
            setValue("settings_map_overview_zoom", document.getElementById('settings_map_overview_zoom').value);
            setValue("settings_map_overview_layer", document.getElementById('settings_map_overview_layer').value);
            setValue("settings_count_own_matrix_show_count_next", document.getElementById('settings_count_own_matrix_show_count_next').value);
            setValue("settings_count_own_matrix_show_color_next", document.getElementById('settings_count_own_matrix_show_color_next').value.replace("#",""));
            setValue("settings_count_own_matrix_links_radius", document.getElementById('settings_count_own_matrix_links_radius').value);
            setValue("settings_count_own_matrix_links", document.getElementById('settings_count_own_matrix_links').value);
            setValue("settings_show_latest_logs_symbols_count", document.getElementById('settings_show_latest_logs_symbols_count').value);
            setValue("settings_default_langu", document.getElementById('settings_default_langu').value);
            setValue("settings_log_statistic_reload", document.getElementById('settings_log_statistic_reload').value);
            setValue("settings_pq_cachestotal", document.getElementById('settings_pq_cachestotal').value);
            setValue("settings_pq_difficulty", document.getElementById('settings_pq_difficulty').value);
            setValue("settings_pq_difficulty_score", document.getElementById('settings_pq_difficulty_score').value);
            setValue("settings_pq_terrain", document.getElementById('settings_pq_terrain').value);
            setValue("settings_pq_terrain_score", document.getElementById('settings_pq_terrain_score').value);
            setValue("settings_pq_previewmap_layer", document.getElementById('settings_pq_previewmap_layer').value);
            setValue("settings_improve_add_to_list_height", document.getElementById('settings_improve_add_to_list_height').value);
            setValue("settings_primary_elevation_service", document.getElementById('settings_primary_elevation_service').value);
            setValue("settings_secondary_elevation_service", document.getElementById('settings_secondary_elevation_service').value);
            setValue("settings_show_latest_logs_symbols_count_map", document.getElementById('settings_show_latest_logs_symbols_count_map').value);
            setValue("settings_show_openrouteservice_medium", document.getElementById('settings_show_openrouteservice_medium').value);
            setValue("settings_compactLayoutUnpublishedHides_sort", document.getElementById('settings_compactLayoutUnpublishedHides_sort').value);
            setValue("settings_showUnpublishedHides_sort", document.getElementById('settings_showUnpublishedHides_sort').value);
            setValue("settings_lists_disabled_color", document.getElementById('settings_lists_disabled_color').value.replace("#",""));
            setValue("settings_lists_archived_color", document.getElementById('settings_lists_archived_color').value.replace("#",""));

            // Map Layers in vorgegebener Reihenfolge übernehmen.
            var new_map_layers_available = document.getElementById('settings_maplayers_available');
            var new_settings_map_layers = new Array();
            for (name in all_map_layers) {
                for (var i = 0; i < new_map_layers_available.options.length; i++) {
                    if (name == new_map_layers_available.options[i].value) {
                        new_settings_map_layers.push(new_map_layers_available.options[i].value);
                        break;
                    }
                }
            }
            setValue('settings_map_layers', new_settings_map_layers.join("###"));

            var checkboxes = new Array(
                'settings_submit_log_button',
                'settings_log_inline',
                'settings_log_inline_pmo4basic',
                'settings_log_inline_tb',
                'settings_bookmarks_show',
                'settings_bookmarks_on_top',
                'settings_change_header_layout',
                'settings_fixed_header_layout',
                'settings_remove_logo',
                'settings_remove_message_in_header',
                'settings_bookmarks_search',
                'settings_redirect_to_map',
                'settings_hide_facebook',
                'settings_hide_socialshare',
                'settings_hide_disclaimer',
                'settings_hide_cache_notes',
                'settings_hide_empty_cache_notes',
                'settings_adapt_height_cache_notes',
                'settings_show_all_logs',
                'settings_decrypt_hint',
                'settings_visitCount_geocheckerCom',
                'settings_show_bbcode',
                'settings_show_eventday',
                'settings_show_mail',
                'settings_gc_tour_is_working',
                'settings_show_smaller_gc_link',
                'settings_menu_show_separator',
                'settings_menu_float_right',
                'settings_show_message',
                'settings_show_remove_ignoring_link',
                'settings_use_one_click_ignoring',
                'settings_use_one_click_watching',
                'settings_show_common_lists_in_zebra',
                'settings_show_common_lists_color_user',
                'settings_show_cache_listings_in_zebra',
                'settings_show_cache_listings_color_user',
                'settings_show_cache_listings_color_owner',
                'settings_show_cache_listings_color_reviewer',
                'settings_show_cache_listings_color_vip',
                'settings_show_tb_listings_in_zebra',
                'settings_show_tb_listings_color_user',
                'settings_show_tb_listings_color_owner',
                'settings_show_tb_listings_color_reviewer',
                'settings_show_tb_listings_color_vip',
                'settings_show_mail_in_allmyvips',
                'settings_show_mail_in_viplist',
                'settings_process_vup',
                'settings_show_vup_friends',
                'settings_vup_hide_avatar',
                'settings_vup_hide_log',
                'settings_f2_save_gclh_config',
                'settings_esc_close_gclh_config',
                'settings_f4_call_gclh_config',
                'settings_f10_call_gclh_sync',
                'settings_show_sums_in_bookmark_lists',
                'settings_show_sums_in_watchlist',
                'settings_hide_warning_message',
                'settings_show_save_message',
                'settings_map_overview_build',
                'settings_logit_for_basic_in_pmo',
                'settings_log_statistic',
                'settings_log_statistic_percentage',
                'settings_count_own_matrix',
                'settings_count_foreign_matrix',
                'settings_count_own_matrix_show_next',
                'settings_hide_left_sidebar_on_google_maps',
                'settings_add_link_gc_map_on_google_maps',
                'settings_switch_to_gc_map_in_same_tab',
                'settings_add_link_google_maps_on_gc_map',
                'settings_switch_to_google_maps_in_same_tab',
                'settings_add_link_osm_on_gc_map',
                'settings_switch_to_osm_in_same_tab',
                'settings_add_link_gc_map_on_osm',
                'settings_switch_from_osm_to_gc_map_in_same_tab',
                'settings_add_link_flopps_on_gc_map',
                'settings_switch_to_flopps_in_same_tab',
                'settings_add_link_geohack_on_gc_map',
                'settings_switch_to_geohack_in_same_tab',
                'settings_sort_default_bookmarks',
                'settings_make_vip_lists_hideable',
                'settings_show_latest_logs_symbols',
                'settings_set_default_langu',
                'settings_hide_colored_versions',
                'settings_make_config_main_areas_hideable',
                'settings_faster_profile_trackables',
                'settings_show_google_maps',
                'settings_show_log_it',
                'settings_show_nearestuser_profil_link',
                'settings_show_homezone',
                'settings_show_hillshadow',
                'remove_navi_play',
                'remove_navi_community',
                'remove_navi_shop',
                'settings_bookmarks_top_menu',
                'settings_hide_advert_link',
                'settings_hide_spoilerwarning',
                'settings_hide_top_button',
                'settings_hide_hint',
                'settings_strike_archived',
                'settings_highlight_usercoords',
                'settings_highlight_usercoords_bb',
                'settings_highlight_usercoords_it',
                'settings_map_hide_found',
                'settings_map_hide_hidden',
                'settings_map_hide_dnfs',
                'settings_map_hide_2',
                'settings_map_hide_9',
                'settings_map_hide_5',
                'settings_map_hide_3',
                'settings_map_hide_6',
                'settings_map_hide_453',
                'settings_map_hide_7005',
                'settings_map_hide_13',
                'settings_map_hide_1304',
                'settings_map_hide_4',
                'settings_map_hide_11',
                'settings_map_hide_137',
                'settings_map_hide_8',
                'settings_map_hide_1858',
                'settings_show_fav_percentage',
                'settings_show_vip_list',
                'settings_show_owner_vip_list',
                'settings_autovisit',
                'settings_show_thumbnails',
                'settings_imgcaption_on_top',
                'settings_hide_avatar',
                'settings_link_big_listing',
                'settings_show_big_gallery',
                'settings_automatic_friend_reset',
                'settings_show_long_vip',
                'settings_load_logs_with_gclh',
                'settings_hide_map_header',
                'settings_replace_log_by_last_log',
                'settings_show_real_owner',
                'settings_hide_archived_in_owned',
                'settings_hide_visits_in_profile',
                'settings_log_signature_on_fieldnotes',
                'settings_vip_show_nofound',
                'settings_use_gclh_layercontrol',
                'settings_fixed_pq_header',
                'settings_sync_autoImport',
                'settings_map_hide_sidebar',
                'settings_friendlist_summary',
                'settings_friendlist_summary_viponly',
                'settings_search_enable_user_defined',
                'settings_pq_warning',
                'settings_pq_set_cachestotal',
                'settings_pq_option_ihaventfound',
                'settings_pq_option_idontown',
                'settings_pq_option_ignorelist',
                'settings_pq_option_isenabled',
                'settings_pq_option_filename',
                'settings_pq_set_difficulty',
                'settings_pq_set_terrain',
                'settings_pq_automatically_day',
                'settings_pq_previewmap',
                'settings_mail_icon_new_win',
                'settings_message_icon_new_win',
                'settings_hide_cache_approvals',
                'settings_driving_direction_link',
                'settings_driving_direction_parking_area',
                'settings_show_elevation_of_waypoints',
                'settings_img_warning',
                'settings_fieldnotes_old_fashioned',
                'settings_remove_banner',
                'settings_remove_banner_for_garminexpress',
                'settings_remove_banner_blue',
                'settings_compact_layout_bm_lists',
                'settings_compact_layout_pqs',
                'settings_compact_layout_list_of_pqs',
                'settings_compact_layout_nearest',
                'settings_compact_layout_recviewed',
                'settings_map_links_statistic',
                'settings_improve_add_to_list',
                'settings_show_flopps_link',
                'settings_show_brouter_link',
                'settings_show_gpsvisualizer_link',
                'settings_show_gpsvisualizer_gcsymbols',
                'settings_show_gpsvisualizer_typedesc',
                'settings_show_openrouteservice_link',
                'settings_show_openrouteservice_home',
                'settings_show_copydata_menu',
                'settings_show_default_links',
                'settings_bm_changed_and_go',
                'settings_bml_changed_and_go',
                'settings_show_tb_inv',
                'settings_but_search_map',
                'settings_but_search_map_new_tab',
                'settings_show_pseudo_as_owner',
                'settings_fav_proz_nearest',
                'settings_fav_proz_pqs',
                'settings_fav_proz_recviewed',
                'settings_show_all_logs_but',
                'settings_show_log_counter_but',
                'settings_show_log_counter',
                'settings_show_bigger_avatars_but',
                'settings_hide_feedback_icon',
                'settings_compact_layout_new_dashboard',
                'settings_show_draft_indicator',
                'settings_show_enhanced_map_popup',
                'settings_modify_new_drafts_page',
                'settings_gclherror_alert',
                'settings_auto_open_tb_inventory_list',
                'settings_embedded_smartlink_ignorelist',
                'settings_both_tabs_list_of_pqs_one_page',
                'settings_past_events_on_bm',
                'settings_show_log_totals',
                'settings_show_reviewer_as_vip',
                'settings_hide_found_count',
                'settings_show_compact_logbook_but',
                'settings_log_status_icon_visible',
                'settings_cache_type_icon_visible',
                'settings_compactLayout_unpublishedList',
                'settings_set_compactLayoutUnpublishedHides_sort',
                'settings_showUnpublishedHides',
                'settings_set_showUnpublishedHides_sort',
                'settings_lists_compact_layout',
                'settings_lists_disabled',
                'settings_lists_disabled_strikethrough',
                'settings_lists_archived',
                'settings_lists_archived_strikethrough',
                'settings_lists_icons_visible',
                'settings_lists_log_status_icons_visible',
                'settings_lists_cache_type_icons_visible',
                'settings_lists_premium_column',
                'settings_lists_found_column_bml',
                'settings_lists_show_log_it',
                'settings_lists_back_to_top',
                'settings_searchmap_autoupdate_after_dragging',
            );

            for (var i = 0; i < checkboxes.length; i++) {
                if (document.getElementById(checkboxes[i])) setValue(checkboxes[i], document.getElementById(checkboxes[i]).checked);
            }

            // Save Log-Templates.
            for (var i = 0; i < anzTemplates; i++) {
                var name = document.getElementById('settings_log_template_name[' + i + ']');
                var text = document.getElementById('settings_log_template[' + i + ']');
                if (name && text) {
                    setValue('settings_log_template_name[' + i + ']', name.value);
                    setValue('settings_log_template[' + i + ']', text.value.replace(/‌/g, ""));  // Entfernt das Steuerzeichen.
                }
            }

            // Save Linklist Rechte Spalte.
            var queue = $("#gclh_LinkListTop tr:not(.gclh_LinkListPlaceHolder)");
            var tmp = new Array();
            for (var i = 0; i < queue.length; i++) {tmp[i] = queue[i].id.replace("gclh_LinkListTop_", "");}
            setValue("settings_bookmarks_list", JSON.stringify(tmp));
            // Save Linklist Abweichende Bezeichnungen, 2. Spalte.
            for (var i = 0; i < bookmarks.length; i++) {
                if (document.getElementById('bookmarks_name[' + i + ']') && document.getElementById('bookmarks_name[' + i + ']') != "") {  // Set custom name.
                    setValue("settings_bookmarks_title[" + i + "]", document.getElementById('bookmarks_name[' + i + ']').value);
                }
            }
            // Save Linklist Custom Links, URL, target, linke Spalte.
            for (var i = 0; i < anzCustom; i++) {
                setValue("settings_custom_bookmark[" + i + "]", document.getElementById("settings_custom_bookmark[" + i + "]").value);
                if (document.getElementById('settings_custom_bookmark_target[' + i + ']').checked) setValue('settings_custom_bookmark_target[' + i + ']', "_blank");
                else setValue('settings_custom_bookmark_target[' + i + ']', "");
            }

            setValueSet(settings).done(function() {
                if (type === "upload") {
                    gclh_sync_DB_CheckAndCreateClient()
                        .done(function(){
                            gclh_sync_DBSave().done(function() {
                                window.location.reload(false);
                            });
                        })
                        .fail(function(){
                            alert('GClh is not authorized to use your Dropbox. Please go to the Sync page and \nauthenticate your Dropbox first. Nevertheless your config is saved localy.');
                            window.location.reload(false);
                        });
                } else window.location.reload(false);
            });
            if (getValue("settings_show_save_message")) {
                document.getElementById("save_overlay_h3").innerHTML = "saved";
                if (type === "upload") $("#save_overlay").fadeOut(400);
            }
        }
    }

//////////////////////////////
// Config Functions
//////////////////////////////
// Radio Buttons zur Linklist.
    function handleRadioTopMenu(first) {
        if (first == true) {
            var time = 0;
            var timeShort = 0;
        } else {
            var time = 500;
            var timeShort = 450;
        }
        // Wenn Linklist nicht on top angezeigt wird, dann muss unbedingt vertikales Menü aktiv sein, falls nicht vertikales Menü setzen.
        if (!$('#settings_bookmarks_on_top')[0].checked && !$('#settings_bookmarks_top_menu')[0].checked) $('#settings_bookmarks_top_menu')[0].click();
        if ($('#settings_bookmarks_top_menu')[0].checked) {
            if ($('#box_top_menu_v')[0].style.display != "block") {
                $('#box_top_menu_v').animate({height: "164px"}, time);
                $('#box_top_menu_v')[0].style.display = "block";
                setTimeout(function() {
                    $('#box_top_menu_h').animate({height: "0px"}, time);
                    setTimeout(function() {$('#box_top_menu_h')[0].style.display = "none";}, timeShort);
                }, time);
            }
        }
        if ($('#settings_bookmarks_top_menu_h')[0].checked) {
            if ($('#box_top_menu_h')[0].style.display != "block") {
                $('#box_top_menu_h').animate({height: "188px"}, time);
                $('#box_top_menu_h')[0].style.display = "block";
                setTimeout(function() {
                    $('#box_top_menu_v').animate({height: "0px"}, time);
                    setTimeout(function() {$('#box_top_menu_v')[0].style.display = "none";}, timeShort);
                }, time);
            }
        }
    }

// Events setzen für Parameter, die im GClh Config mehrfach ausgegeben wurden, weil sie zu mehreren Themen gehören. Es handelt sich hier um den Parameter selbst. Hier
// werden Events für den Parameter selbst (ZB: "settings_show_mail_in_viplist") und dessen Clone gesetzt, die hinten mit einem "X" und Nummerierung von 0-9 enden können
// (ZB: "settings_show_mail_in_viplistX0").
    function setEvForDouPara(paraName, event) {
        var paId = paraName;
        if (document.getElementById(paId)) {
            document.getElementById(paId).addEventListener(event, function() {handleEvForDouPara(this);}, false);
            for (var i = 0; i < 10; i++) {
                var paIdX = paId + "X" + i;
                if (document.getElementById(paIdX)) {
                    document.getElementById(paIdX).addEventListener(event, function() {handleEvForDouPara(this);}, false);
                }
            }
        }
    }

// Handling von Events zu Parametern, die im GClh Config mehrfach ausgegeben wurden, weil sie zu mehreren Themen gehören. Es kann sich hier um den Parameter selbst handeln
// (ZB: "settings_show_mail_in_viplist"), oder um dessen Clone, die hinten mit "X" und Nummerierung von 0-9 enden können (ZB: "settings_show_mail_in_viplistX0"). Hier wird
// Wert des eventauslösenden Parameters, das kann auch Clone sein, an den eigentlichen Parameter und dessen Clone weitergereicht.
    function handleEvForDouPara(para) {
        var paId = para.id.replace(/(X[0-9]*)/, "");
        if (document.getElementById(paId)) {
            if (document.getElementById(paId).type == "checkbox") {
                document.getElementById(paId).checked = para.checked;
                for (var i = 0; i < 10; i++) {
                    var paIdX = paId + "X" + i;
                    if (document.getElementById(paIdX)) document.getElementById(paIdX).checked = para.checked;
                }
            } else if (para.id.match(/_color_/)) {
                document.getElementById(paId).value = para.value;
                document.getElementById(paId).style.backgroundColor = "#" + para.value;
                document.getElementById(paId).style.color = para.style.color;
                for (var i = 0; i < 10; i++) {
                    var paIdX = paId + "X" + i;
                    if (document.getElementById(paIdX)) {
                        document.getElementById(paIdX).value = para.value;
                        document.getElementById(paIdX).style.backgroundColor = "#" + para.value;
                        document.getElementById(paIdX).style.color = para.style.color;
                    }
                }
            } else {
                document.getElementById(paId).value = para.value;
                for (var i = 0; i < 10; i++) {
                    var paIdX = paId + "X" + i;
                    if (document.getElementById(paIdX)) document.getElementById(paIdX).value = para.value;
                }
            }
        }
    }

// Events setzen für Parameter, die im GClh Config eine Abhängigkeit derart auslösen, dass andere Parameter aktiviert bzw. deaktiviert
// werden müssen. ZB: können Mail Icons in VIP List (Parameter "settings_show_mail_in_viplist") nur dann aufgebaut werden, wenn Mail Icons
// überhaupt erzeugt werden (Parameter "settings_show_mail"). Clone müssen hier auch berücksichtigt werden.
    function setEvForDepPara(paraName, paraNameDep, allActivated) {
        var paId = paraName;
        var paIdDep = paraNameDep;
        var countDep = global_dependents.length;
        if (allActivated != false) allActivated = true;

        // Wenn Parameter und abhängiger Parameter existieren, dann für Parameter Event setzen, falls nicht vorhanden und Parameter, abhängigen Parameter merken.
        if (document.getElementById(paId) && document.getElementById(paIdDep)) {
            var available = false;
            for (var i = 0; i < countDep; i++) {
                if (global_dependents[i]["paId"] == paId) {
                    available = true;
                    break;
                }
            }
            if (available == false) {
                document.getElementById(paId).addEventListener("click", function() {handleEvForDepPara(this);}, false);
            }
            global_dependents[countDep] = new Object();
            global_dependents[countDep]["paId"] = paId;
            global_dependents[countDep]["paIdDep"] = paIdDep;
            global_dependents[countDep]["allActivated"] = allActivated;

            // Alle möglichen Clone zum abhängigen Parameter suchen.
            for (var i = 0; i < 10; i++) {
                var paIdDepX = paIdDep + "X" + i;
                // Wenn Clone zum abhängigen Parameter existiert, dann Parameter und Clone zum abhängigen Parameter merken.
                if (document.getElementById(paIdDepX)) {
                    countDep++;
                    global_dependents[countDep] = new Object();
                    global_dependents[countDep]["paId"] = paId;
                    global_dependents[countDep]["paIdDep"] = paIdDepX;
                    global_dependents[countDep]["allActivated"] = allActivated;
                } else break;
            }
        }
    }
    // Anfangsbesetzung herstellen.
    function setStartForDepPara() {
        var countDep = global_dependents.length;
        var paIdCompare = "";

        // Sort nach paId.
        global_dependents.sort(function(a, b){
            if (a.paId < b.paId) return -1;
            if (a.paId > b.paId) return 1;
            return 0;
        });
        var copy_global_dependents = global_dependents;

        for (var i = 0; i < countDep; i++) {
            if (paIdCompare != copy_global_dependents[i]["paId"]) {
                if (document.getElementById(copy_global_dependents[i]["paId"])) {
                    var para = document.getElementById(copy_global_dependents[i]["paId"]);
                    handleEvForDepPara(para);
                }
                paIdCompare = copy_global_dependents[i]["paId"];
            }
        }
    }
    // Handling Events.
    function handleEvForDepPara(para) {
        var paId = para.id;
        var countDep = global_dependents.length;
        var copy_global_dependents = global_dependents;

        // Wenn Parameter existiert, dann im Array der abhängigen Parameter nachsehen, welche abhängigen Parameter es dazu gibt.
        if (document.getElementById(paId)) {
            for (var i = 0; i < countDep; i++) {
                if (global_dependents[i]["paId"] == paId) {

                    // Wenn abhängige Parameter existiert.
                    if (document.getElementById(global_dependents[i]["paIdDep"])) {
                        // Wenn Parameter markiert, dann soll abhängiger Parameter aktiviert werden. Zuvor prüfen, ob alle Parameter zu diesem abhängigen Parameter aktiviert
                        // werden sollen. Nur dann darf abhängiger Parameter aktiviert werden. (ZB: Abh. Parameter "settings_show_mail_in_viplist", ist von zwei Parametern abhängig.
                        if (para.checked) {
                            if (checkDisabledForDepPara(global_dependents[i]["paIdDep"])) {
                                var activate = true;
                                if (global_dependents[i]["allActivated"]) {
                                    for (var k = 0; k < countDep; k++) {
                                        if (copy_global_dependents[k]["paIdDep"] == global_dependents[i]["paIdDep"] &&
                                            copy_global_dependents[k]["paId"] != global_dependents[i]["paId"]) {
                                            if (document.getElementById(copy_global_dependents[k]["paId"]) &&
                                                document.getElementById(copy_global_dependents[k]["paId"]).checked);
                                            else {
                                                activate = false;
                                                break;
                                            }
                                        }
                                    }
                                }
                                if (activate) disableDepPara(global_dependents[i]["paIdDep"], false);
                            }

                        // Wenn Parameter nicht markiert, dann soll abhängiger Parameter deaktiviert werden. Zuvor prüfen, ob alle Parameter zu diesem abhängigen Parameter deaktiviert
                        // werden sollen. Nur dann darf abhängiger Parameter deaktiviert werden. (ZB: Abhängiger Parameter Linklistparameter, sind von zwei Parametern abhängig.)
                        } else {
                            if (!checkDisabledForDepPara(global_dependents[i]["paIdDep"])) {
                                var deactivate = true;
                                if (global_dependents[i]["allActivated"] != true) {
                                    for (var k = 0; k < countDep; k++) {
                                        if (copy_global_dependents[k]["paIdDep"] == global_dependents[i]["paIdDep"] &&
                                            copy_global_dependents[k]["paId"] != global_dependents[i]["paId"]) {
                                            if (document.getElementById(copy_global_dependents[k]["paId"]) &&
                                                document.getElementById(copy_global_dependents[k]["paId"]).checked) {
                                                deactivate = false;
                                                break;
                                            }
                                        }
                                    }
                                }
                                if (deactivate) disableDepPara(global_dependents[i]["paIdDep"], true);
                            }
                        }
                    }
                }
            }
        }
    }
    // Prüfen, ob disabled.
    function checkDisabledForDepPara(id) {
        var elem = document.getElementById(id);
        var elem$ = $("#"+id);
        if ((elem.disabled) ||
            (elem$.hasClass("ui-droppable") && elem$.hasClass("ui-droppable-disabled")) ||
            (elem$.hasClass("ui-draggable") && elem$.hasClass("ui-draggable-disabled"))) {
            return true;
        } else return false;
    }
    // Disabled setzen bzw. entfernen.
    function disableDepPara(id, set) {
        var elem = document.getElementById(id);
        var elem$ = $("#"+id);
        if (elem$.hasClass("ui-droppable")) {
            elem$.droppable("option", "disabled", set);
            elem$.sortable("option", "disabled", set);
            if (set == true) elem.parentNode.style.opacity = "0.5";
            else elem.parentNode.style.opacity = "1";
        } else if (elem$.hasClass("ui-draggable")) {
            elem$.draggable("option", "disabled", set);
            if (set == true) elem.parentNode.style.opacity = "0.5";
            else elem.parentNode.style.opacity = "1";
        } else {
            elem.disabled = set;
            if (set == true) elem.style.opacity = "0.5";
            else elem.style.opacity = "1";
            // Alle möglichen Clone zum abhängigen Parameter suchen und ebenfalls verarbeiten.
            for (var j = 0; j < 10; j++) {
                var paIdDepX = id + "X" + j;
                if (document.getElementById(paIdDepX)) {
                    document.getElementById(paIdDepX).disabled = set;
                    if (set == true) document.getElementById(paIdDepX).style.opacity = "0.5";
                    else document.getElementById(paIdDepX).style.opacity = "1";
                } else break;
            }
        }
    }

// Warnung, wenn Logs nicht durch GClh geladen werden sollen.
    function alert_settings_load_logs_with_gclh() {
        if (!document.getElementById("settings_load_logs_with_gclh").checked) {
            var mess = "If this option is disabled, there are no VIP-, VUP-, mail-, message-\n"
                     + "and top icons, no line colors and no mouse activated big images \n"
                     + "at the logs. Also the VIP and VUP lists, hide avatars, log filter and \n"
                     + "log search and the latest logs won't work.";
            alert(mess);
        }
    }

// Wenn VUPs im Config deaktiviert wird und es sind VUPs vorhanden, dann Confirm Meldung, dass die VUPs gelöscht werden.
// Ansonsten können Konstellationen mit Usern entstehen, die gleichzeitig VIP und VUP sind.
    function alert_settings_process_vup() {
        if (!document.getElementById("settings_process_vup").checked && getValue("vups")) {
            var vups = getValue("vups");
            vups = vups.replace(/, (?=,)/g, ",null");
            vups = JSON.parse(vups);
            if (vups.length > 0) {
                var text = "You have " + vups.length + " VUPs (very unimportant persons) saved. \n"
                         + "If you disable this feature of VUP processing, the VUPs\n"
                         + "are deleted. Please note, it can not be revoked.\n\n"
                         + "Click OK to delete the VUPs now and disable the feature.";
                if (window.confirm(text)) {
                    var vups = new Array();
                    setValue("vups", JSON.stringify(vups));
                } else {
                    document.getElementById("settings_process_vup").checked = "checked";
                }
            }
        }
    }

// Feldinhalt auf default zurücksetzen.
    function restoreField() {
        if (document.getElementById(this.id).disabled) return;
        var fieldId = this.id.replace(/restore_/, "");
        var field = document.getElementById(fieldId);
        if (this.id.match(/_color/)) {
            field.value = "93B516";
            field.style.color = "black";
            switch (fieldId) {
                case "settings_lines_color_zebra": field.value = "EBECED"; break;
                case "settings_lines_color_user": field.value = "C2E0C3"; break;
                case "settings_lines_color_owner": field.value = "E0E0C3"; break;
                case "settings_lines_color_reviewer": field.value = "EAD0C3"; break;
                case "settings_lines_color_vip": field.value = "F0F0A0"; break;
                case "settings_lists_disabled_color": field.value = "4A4A4A"; break;
                case "settings_lists_archived_color": field.value = "8C0B0B"; break;
                case "settings_font_color_menu": restoreColor("settings_font_color_menuX0", "restore_settings_font_color_menuX0", field.value); break;
                case "settings_font_color_menuX0": restoreColor("settings_font_color_menu", "restore_settings_font_color_menu", field.value); break;
                case "settings_font_color_submenu": restoreColor("settings_font_color_submenuX0", "restore_settings_font_color_submenuX0", field.value); break;
                case "settings_font_color_submenuX0": restoreColor("settings_font_color_submenu", "restore_settings_font_color_submenu", field.value); break;
                case "settings_count_own_matrix_show_color_next": field.value = "5151FB"; field.style.color = "white"; break;
            }
            field.style.backgroundColor = "#" + field.value;
        }
    }
    function restoreColor(p, r, v) {
        if ($('#'+r)[0] && $('#'+p)[0].value != v) $('#'+r)[0].click();
    }

// Bezeichnung Save, Close Button setzen.
    function setValueInSaveButton() {
        var cont = setValueInButton("save", "(F2)", "settings_f2_save_gclh_config", "btn_save");
        return cont;
    }
    function setValueInCloseButton() {
        var cont = setValueInButton("close", "(ESC)", "settings_esc_close_gclh_config", "btn_close2");
        return cont;
    }
    function setValueInButton(cont, fKey, para, butt) {
        if ($('#'+para)[0]) {  // Nach Aufbau Config.
            if ($('#'+para)[0].checked) cont += " "+fKey;
            $('#'+butt)[0].setAttribute("value", cont);
        } else {  // Vor Aufbau Config.
            if (getValue(para,"")) cont += " "+fKey;
            return cont;
        }
    }

// Info gespeichert ausgeben.
    function showSaveForm() {
        if (document.getElementById('save_overlay')) {
        } else {
            var css = "";
            css += "#save_overlay {background-color: #d8cd9d; width:560px; margin-left: 20px; border: 2px solid #778555; overflow: auto; padding:10px; position: absolute; left:30%; top:70px; z-index:1004; border-radius: 10px;}";
            css += ".gclh_form {background-color: #d8cd9d; border: 2px solid #778555; padding-left: 5px; padding-right: 5px;}";
            css += "h3 {margin: 0;}";
            appendCssStyle(css);
            var side = $('body')[0];
            var html = "<h3 id='save_overlay_h3'></h3>";
            var div = document.createElement("div");
            div.setAttribute("id", "save_overlay");
            div.setAttribute("align", "center");
            div.innerHTML = html;
            div.appendChild(document.createTextNode(""));
            side.appendChild(div);
        }
        $('#save_overlay_h3')[0].innerHTML = "save...";
        $('#save_overlay')[0].style.display = "";
    }

// Änderungen an abweichenden Bezeichnungen in Spalte 2, in Value in Spalte 3 updaten.
    function updateByInputDescription() {
        // Ids ermitteln für linke und rechte Spalte.
        var idColLeft = this.id.replace("bookmarks_name[", "gclh_LinkListElement_").replace("]", "");
        var idColRight = this.id.replace("bookmarks_name[", "gclh_LinkListTop_").replace("]", "");
        // Bezeichnung ermitteln.
        if (this.value.match(/(\S+)/)) var description = this.value;
        else {
            if (document.getElementById(idColLeft).children[1].id.match("custom")) {
                var description = "Custom" + document.getElementById(idColLeft).children[1].id.replace("settings_custom_bookmark[", "").replace("]", "");
                this.value = description;
            } else var description = document.getElementById(idColLeft).children[1].innerHTML;
        }
        // Update.
        if (document.getElementById(idColRight) && document.getElementById(idColRight).children[0].childNodes[2]) {
            document.getElementById(idColRight).children[0].childNodes[2].nodeValue = description;
        }
    }

// Attribute ändern bei Mousedown, Mouseup in rechter Spalte, Move Icon und Bezeichnung.
    function changeAttrMouse(event, elem, obj) {
        if (event.type == "mousedown") elem.style.cursor = "grabbing";
        else {
            if (obj == "move") elem.style.cursor = "grab";
            else if (obj == "desc") elem.style.cursor = "unset";
        }
    }

// BM kennzeichnen wenn sie in Linklist ist.
    function flagBmInLl(tdBmEntry, doDragging, setCursor, setOpacity, setTitle) {
        if (doDragging) {
            tdBmEntry.style.cursor = setCursor;
            tdBmEntry.style.opacity = setOpacity;
            tdBmEntry.children[0].style.cursor = setCursor;
            tdBmEntry.children[0].style.opacity = setOpacity;
            tdBmEntry.children[1].style.cursor = setCursor;
            tdBmEntry.children[1].style.opacity = setOpacity;
        } else {
            tdBmEntry.children[0].style.cursor = setCursor;
            tdBmEntry.children[0].style.opacity = setOpacity;
            tdBmEntry.children[0].title = setTitle;
        }
    }

// Sort Linklist.
    function sortBookmarksByDescription(sort, bm) {
        // BMs für Sortierung aufbereiten. Wird immer benötigt, auch wenn nicht sortiert wird.
        var cust = 0;
        for (var i = 0; i < bm.length; i++) {
            bm[i]['number'] = i;
            if (typeof(bm[i]['custom']) != "undefined" && bm[i]['custom'] == true) {
                bm[i]['origTitle'] = "Custom" + cust + ": " + bm[i]['title'];
                bm[i]['sortTitle'] = cust;
                cust++;
            } else {
                bm[i]['origTitle'] = bm[i]['sortTitle'] = (typeof(bookmarks_orig_title[i]) != "undefined" && bookmarks_orig_title[i] != "" ? bookmarks_orig_title[i] : bm[i]['title']);
                bm[i]['sortTitle'] = bm[i]['sortTitle'].toLowerCase().replace(/ä/g,"a").replace(/ö/g,"o").replace(/ü/g,"u").replace(/ß/g,"s");
            }
        }
        // BMs nach sortTitle sortieren.
        if (sort) {
            bm.sort(function(a, b){
                if ((typeof(a.custom) != "undefined" && a.custom == true) && !(typeof(b.custom) != "undefined" && b.custom == true)) {
                    // a nach hinten, also a > b.
                    return 1;
                } else if (!(typeof(a.custom) != "undefined" && a.custom == true) && (typeof(b.custom) != "undefined" && b.custom == true)) {
                    // b nach hinten, also a < b.
                    return -1;
                }
                if (a.sortTitle < b.sortTitle) return -1;
                if (a.sortTitle > b.sortTitle) return 1;
                return 0;
            });
        }
        return bm;
    }

// Show, hide all areas in config with one click of right mouse.
    function showHideConfigAll(id_lnk) {
        showHide = showHideBoxCL(id_lnk, false);
        setShowHideConfigAll("gclh_config_global", showHide);
        setShowHideConfigAll("gclh_config_config", showHide);
        setShowHideConfigAll("gclh_config_nearestlist", showHide);
        setShowHideConfigAll("gclh_config_pq", showHide);
        setShowHideConfigAll("gclh_config_bm", showHide);
        setShowHideConfigAll("gclh_config_recview", showHide);
        setShowHideConfigAll("gclh_config_friends", showHide);
        setShowHideConfigAll("gclh_config_hide", showHide);
        setShowHideConfigAll("gclh_config_others", showHide);
        setShowHideConfigAll("gclh_config_maps", showHide);
        setShowHideConfigAll("gclh_config_profile", showHide);
        setShowHideConfigAll("gclh_config_db", showHide);
        setShowHideConfigAll("gclh_config_listing", showHide);
        setShowHideConfigAll("gclh_config_logging", showHide);
        setShowHideConfigAll("gclh_config_mail", showHide);
        setShowHideConfigAll("gclh_config_linklist", showHide);
        setShowHideConfigAll("gclh_config_development", showHide);
        if (showHide == "show") window.scroll(0, 0);
        else {
            document.getElementById(id_lnk).scrollIntoView();
            window.scrollBy(0, -15);
        }
    }
    function setShowHideConfigAll(stamm, whatToDo) {
        $('#lnk_'+stamm)[0].title = (whatToDo == "show" ? "show topic\n(all topics with right mouse)" : "hide topic\n(all topics with right mouse)");
        $('#lnk_'+stamm)[0].src = (whatToDo == "show" ? global_plus_config2 : global_minus_config2);
        $('#lnk_'+stamm)[0].parentNode.className = $('#lnk_'+stamm)[0].parentNode.className.replace(" gclh_hide","");
        if (whatToDo == "show") {
            $('#'+stamm).hide();
            $('#lnk_'+stamm)[0].parentNode.className += " gclh_hide";
        } else {
            $('#'+stamm).show();
        }
        setValue("show_box_"+stamm, (whatToDo == "show" ? false : true));
    }

// Show config screen "thanks".
    function thanksShow() {
        if (document.getElementById('settings_overlay')) document.getElementById('settings_overlay').style.overflow = "hidden";
        $('#gclh_config_content1').hide();
        $('#gclh_config_content3').hide();
        $('#gclh_config_content_thanks').show(600);
    }

// Build line with user and contribution on config screen "thanks".
    function thanksLineBuild(gcname, ghname, proj, devl, dev, err, sepa) {
        return "<tr " + (sepa == true ? "class='separator'" : "") + ">" +
               "<td>" + (gcname != "" ? "<a href='/profile/?u="+urlencode(gcname)+"' target='_blank' title='GC profile for "+gcname+"'>"+gcname+"</a>" : ghname) + "</td>" +
               thanksFlagBuild(proj) + thanksFlagBuild(devl) + thanksFlagBuild(dev) + thanksFlagBuild(err) + "</tr>";
    }
    function thanksFlagBuild(flag) {return "<td><img src='" + (flag == true ? global_green_tick : "") + "'></td>";}

//////////////////////////////
// Config Reset Functions
//////////////////////////////
    function rcPrepare() {
        global_mod_reset = true;
        if (document.getElementById('settings_overlay')) document.getElementById('settings_overlay').style.overflow = "hidden";
        $('#gclh_config_content1').hide();
        $('#gclh_config_content3').hide();
        $('#gclh_config_content2').show(600);
    }
    function rcReset() {
        try {
            if (document.getElementById("rc_standard").checked || document.getElementById("rc_temp").checked) {
                if (!window.confirm("Click OK to reset the data. \nPlease note, this process can not be revoked.")) return;
            }
            if (document.getElementById("rc_doing")) document.getElementById("rc_doing").src = "/images/loading2.gif";
            if (document.getElementById("rc_reset_button")) document.getElementById("rc_reset_button").disabled = true;
            if (document.getElementById("rc_homecoords").checked) {
                var keysDel = new Array();
                keysDel[keysDel.length] = "home_lat";
                keysDel[keysDel.length] = "home_lng";
                rcConfigDataDel(keysDel);
            }
            if (document.getElementById("rc_uid").checked) {
                var keysDel = new Array();
                keysDel[keysDel.length] = "uid";
                rcConfigDataDel(keysDel);
            }
            if (document.getElementById("rc_standard").checked) {
//--> $$004
                rcGetData(urlConfigSt, "st");
//<-- $$004
            }
            if (document.getElementById("rc_temp").checked) {
                rcGetData(urlScript, "js");
            }
        } catch(e) {gclh_error("Reset config data",e);}
    }
    function rcGetData(url, name) {
        global_rc_data = global_rc_status = "";
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            onload: function(response) {
                global_rc_status = parseInt(response.status);
                global_rc_data = response.responseText;
            }
        });
        function rcCheckDataLoad(waitCount, name) {
            if (global_rc_data == "" || global_rc_status != 200) {
                waitCount++;
                if (waitCount <= 25) setTimeout(function(){rcCheckDataLoad(waitCount, name);}, 200);
                else {
                    alert("Can not load file with " + (name == "st" ? "standard configuration data":"script data") + ".\nNothing changed.");
                    if (document.getElementById("rc_doing")) setTimeout(function(){document.getElementById("rc_doing").src = "";}, 500);
                }
            } else {
                if (name == "st") rcConfigDataChange(global_rc_data);
                if (name == "js") rcConfigDataNotInUseDel(global_rc_data);
            }
        }
        rcCheckDataLoad(0, name);
    }
    function rcConfigDataDel(data) {
        var config_tmp = {};
        var changed = false;
        for (key in CONFIG) {
            var del = false;
            for (var i = 0; i < data.length; i++) {
                if (key == data[i]) {
                    changed = true;
                    del = true;
                    document.getElementById('rc_configData').innerText += "delete: " + data[i] + ": " + CONFIG[key] + "\n";
                    break;
                }
            }
            if (!del) config_tmp[key] = CONFIG[key];
        }
        CONFIG = config_tmp;
        rcConfigUpdate(changed);
    }
    function rcConfigDataChange(stData) {
        var data = JSON.parse(stData);
        var changed = false;
        for (key in data) {
            if (data[key] != CONFIG[key]) {
                changed = true;
                document.getElementById('rc_configData').innerText += "change: " + key + ": " + CONFIG[key] + " -> " + data[key] + "\n";
                CONFIG[key] = data[key];
            }
        }
        rcConfigUpdate(changed);
    }
    function rcConfigDataNotInUseDel(data) {
        var config_tmp = {};
        var changed = false;
        for (key in CONFIG) {
            var kkey = key.split("[");
            var kkey = kkey[0];
//--> $$005
            if (kkey.match(/^(show_box)/) ||
                kkey.match(/^gclh_(.*)(_logs_get_last|_logs_count)$/)) {
                config_tmp[key] = CONFIG[key];
//<-- $$005
            } else if (kkey.match(/autovisit_(\d+)/) ||
                       kkey.match(/^(friends_founds_|friends_hides_)/) ||
                       kkey.match(/^(settings_DB_auth_token|new_version|class|token)$/)) {
                changed = true;
                document.getElementById('rc_configData').innerText += "delete: " + key + ": " + CONFIG[key] + "\n";
            } else if (data.match(kkey)) {
                config_tmp[key] = CONFIG[key];
            } else {
                changed = true;
                document.getElementById('rc_configData').innerText += "delete: " + key + ": " + CONFIG[key] + "\n";
            }
        }
        CONFIG = config_tmp;
        rcConfigUpdate(changed);
    }
    function rcConfigUpdate(changed) {
        setTimeout(function(){
            if (document.getElementById("rc_doing")) document.getElementById("rc_doing").src = "";
            if (document.getElementById("rc_reset_button")) document.getElementById("rc_reset_button").disabled = false;
        }, 500);
        if (changed) {
            var defer = $.Deferred();
            GM_setValue("CONFIG", JSON.stringify(CONFIG));
            defer.resolve();
            return defer.promise();
        } else document.getElementById('rc_configData').innerText += "(nothing to change)\n";
    }
    function rcClose() {
        window.scroll(0, 0);
        $("#settings_overlay").fadeOut(400);
        document.location.href = clearUrlAppendix(document.location.href, false);
        window.location.reload(false);
    }

//////////////////////////////
// Sync Main
//////////////////////////////
// Get/Set Config Data.
    function sync_getConfigData() {
        var data = {};
        var value = null;
        for (key in CONFIG) {
            if (!gclhConfigKeysIgnoreForBackup[key]) {
                value = getValue(key, null);
                if (value != null) data[key] = value;
            }
        }
        return JSON.stringify(data, undefined, 2);
    }
    function sync_setConfigData(data) {
        var parsedData = JSON.parse(data);
        var settings = {};
        for(key in parsedData){
            if (!gclhConfigKeysIgnoreForBackup[key]) settings[key] = parsedData[key];
        }
        setValueSet(settings).done(function() {});
    }

    var dropbox_client = null;
    var dropbox_save_path = '/GCLittleHelperSettings.json';

// Dropbox auth token bereitstellen.
    (function(window){
        window.utils = {
            parseQueryString: function(str) {
                try {
                    var ret = Object.create(null);
                    if (typeof str !== 'string') return ret;
                    str = str.trim().replace(/^(\?|#|&)/, '');
                    if (!str) return ret;
                    str.split('&').forEach(function(param) {
                        var parts = param.replace(/\+/g, ' ').split('=');
                        // Firefox (pre 40) decodes `%3D` to `=` (https://github.com/sindresorhus/query-string/pull/37)
                        var key = parts.shift();
                        var val = parts.length > 0 ? parts.join('=') : undefined;
                        key = decodeUnicodeURIComponent(key);
                        // missing `=` should be `null`: (http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters)
                        val = val === undefined ? null : decodeUnicodeURIComponent(val);
                        if (ret[key] === undefined) ret[key] = val;
                        else if (Array.isArray(ret[key])) ret[key].push(val);
                        else ret[key] = [ret[key], val];
                    });
                    return ret;
                } catch(e) { gclh_error("parseQueryString()",e)};
            }
        };
    })(window);

// Save dropbox auth token if one is passed (from Dropbox).
    var DB_token = utils.parseQueryString(window.location.hash).access_token;
    var AppId = utils.parseQueryString(window.location.search).AppId;
    // Von Dropbox zurück, schaue ob Token von uns angefordert wurde.
    if (AppId == 'GClh') {
        if (DB_token) {
            // Gerade von DB zurück, also Show config.
            setValue('settings_DB_auth_token', DB_token);
            gclh_showSync();
            document.getElementById('syncDBLabel').click();
        } else {
            // Maybe the user denies Access (this is mostly an unwanted click), so show him, that he
            // has refused to give us access to his dropbox and that he can re-auth if he want to.
            error = utils.parseQueryString(window.location.hash).error_description;
            if (error) alert('We received the following error from dropbox: "' + error + '" If you think this is a mistake, you can try to re-authenticate in the sync menue of GClh.');
        }
    }

// Created the Dropbox Client with the given auth token from config.
    function gclh_sync_DB_CheckAndCreateClient() {
        var deferred = $.Deferred();
        token = getValue('settings_DB_auth_token');
        if (token) {
            // Try to create an instance and test it with the current token
            dropbox_client = new Dropbox({accessToken: token});
            dropbox_client.usersGetCurrentAccount()
                .then(function(response) {
                    deferred.resolve();
                })
                .catch(function(error) {
                    console.error('gclh_sync_DB_CheckAndCreateClient: Error while creating Dropbox Client:');
                    console.error(error);
                    deferred.reject();
                });
        } else {
            // No token was given, user has to (re)auth GClh for dropbox
            dropbox_client = null;
            deferred.reject();
        }
        return deferred.promise();
    }

// If the Dropbox Client could not be instantiated (because of wrong token, App deleted or not authenticated at all), this will show the Auth link.
    function gclh_sync_DB_showAuthLink() {
        var APP_ID = 'zp4u1zuvtzgin6g';
        // If client could not created, try to get a new Auth token. Set the login anchors href using dropbox_client.getAuthenticationUrl()
        dropbox_auth_client = new Dropbox({clientId: APP_ID});
        authlink = document.getElementById('authlink');
        // Dropbox redirect URL and AppId.
        authlink.href = dropbox_auth_client.getAuthenticationUrl('https://www.geocaching.com/account/settings/profile?AppId=GClh');
        $(authlink).show();
        $('#btn_DBSave').hide();
        $('#btn_DBLoad').hide();
        $('#syncDBLoader').hide();
    }

// If the Dropbox Client is instantiated and the connection stands, this funciton shows the load and save buttons.
    function gclh_sync_DB_showSaveLoadLinks() {
        $('#btn_DBSave').show();
        $('#btn_DBLoad').show();
        $('#syncDBLoader').hide();
        $('#authlink').hide();
    }

// Saves the current config to dropbox.
    function gclh_sync_DBSave() {
        var deferred = $.Deferred();
        gclh_sync_DB_CheckAndCreateClient()
            .fail(function(){
                // Should not be reached, because we checked the client earlier
                alert('Something went wrong. Please reload the page and try again.');
                deferred.reject();
                $('#syncDBLoader').hide();
                return deferred.promise();
            });
        $('#syncDBLoader').show();
        dropbox_client.filesUpload({
            path: dropbox_save_path,
            contents: sync_getConfigData(),
            mode: 'overwrite',
            autorename: false,
            mute: false
            })
            .then(function(response) {
                deferred.resolve();
                $('#syncDBLoader').hide();
            })
            .catch(function(error) {
                console.error('gclh_sync_DBSave: Error while uploading config file:');
                console.error(error);
                deferred.reject();
                $('#syncDBLoader').hide();
            });
        return deferred.promise();
    }

// Loads the config from dropbox and replaces the current configuration with it.
    function gclh_sync_DBLoad() {
        var deferred = $.Deferred();
        gclh_sync_DB_CheckAndCreateClient()
            .fail(function(){
                // Should not be reached, because we checked the client earlier
                alert('Something went wrong. Please reload the page and try again.');
                deferred.reject();
                return deferred.promise();
            });
        $('#syncDBLoader').show();
        dropbox_client.filesDownload({path: dropbox_save_path})
            .then(function(data) {
                var blob = data.fileBlob;
                var reader = new FileReader();
                reader.addEventListener("loadend", function() {
                    sync_setConfigData(reader.result);
                    deferred.resolve();
                });
                reader.readAsText(blob);
                $('#syncDBLoader').hide();
            })
            .catch(function(error) {
                console.error('gclh_sync_DBLoad: Error while downloading config file:');
                console.error(error);
                deferred.reject();
                $('#syncDBLoader').hide();
            });
        return deferred.promise();
    }

// Gets the hash of the saved config, so we can determine if we have to apply the config loaded from dropbox via autosync.
    function gclh_sync_DBHash() {
        var deferred = $.Deferred();
        gclh_sync_DB_CheckAndCreateClient()
            .fail(function(){
                deferred.reject('Dropbox client is not initiated.');
                return deferred.promise();
            });
        dropbox_client.filesGetMetadata({
            "path": dropbox_save_path,
            "include_media_info": false,
            "include_deleted": false,
            "include_has_explicit_shared_members": false
            })
            .then(function(response) {
                // console.log('content_hash:' + response.content_hash);
                if (response != null && response != "") deferred.resolve(response.content_hash);
                else deferred.reject('Error: response had no file or file was empty.');
            })
            .catch(function(error) {
                console.log('gclh_sync_DBHash: Error while getting hash for config file:');
                console.log(error);
                deferred.reject(error);
            });
        return deferred.promise();
    }

// Reload page.
    function reloadPage() {
        if (document.location.href.indexOf("#") == -1 || document.location.href.indexOf("#") == document.location.href.length - 1) {
            $('html, body').animate({scrollTop: 0}, 0);
            document.location.reload(true);
        } else document.location.replace(document.location.href.slice(0, document.location.href.indexOf("#")));
    }

// Sync anzeigen.
    function gclh_showSync() {
        btnClose();
        scroll(0, 0);
        if ($('#bg_shadow')[0]) {
            if ($('#bg_shadow')[0].style.display == "none") $('#bg_shadow')[0].style.display = "";
        } else buildBgShadow();
        if ($('#sync_settings_overlay')[0] && $('#sync_settings_overlay')[0].style.display == "none") $('#sync_settings_overlay')[0].style.display = "";
        else {
            create_config_css();
            var div = document.createElement("div");
            div.setAttribute("id", "sync_settings_overlay");
            div.setAttribute("class", "settings_overlay");
            var html = "";
            html += "<h3 class='gclh_headline' title='Some little things to make life easy (on www.geocaching.com).' >" + scriptNameSync + " <font class='gclh_small'>v" + scriptVersion + "</font></h3>";
            html += "<div class='gclh_content'>";
            html += "<h4 class='gclh_headline2' id='syncDBLabel' style='cursor: pointer;'>DropBox <font class='gclh_small'>(click to hide/show)</font></h4>";
            html += "<div style='display:none;' id='syncDB' >";
            html += "<div id='syncDBLoader'><img style='height: 40px;' src='"+global_syncDBLoader_icon+"'> working...</div>";
            html += "<a href='#' class='gclh_form' style='display: none;' id='authlink' class='button'>authenticate</a>";
            html += "<input class='gclh_form' type='button' value='save to DropBox' id='btn_DBSave' style='display: none;'> ";
            html += "<input class='gclh_form' type='button' value='load from DropBox' id='btn_DBLoad' style='display: none;'>";
            html += "</div>";
            html += "<h4 class='gclh_headline2' id='syncManualLabel' style='cursor: pointer;'>Manual <font class='gclh_small'>(click to hide/show)</font></h4>";
            html += "<div style='display:none;' id='syncManual' >";
            html += "<pre class='gclh_form' style='display: block; width: 550px; height: 300px; overflow: auto; margin-top: 0; margin-bottom: 6px !important' type='text' value='' id='configData' size='28' contenteditable='true'></pre>";
            html += "<input class='gclh_form' type='button' value='export' id='btn_ExportConfig'> ";
            html += "<input class='gclh_form' type='button' value='import' id='btn_ImportConfig'>";
            html += "</div>";
            html += "<br><br>";
            html += "<input class='gclh_form' type='button' value='close' id='btn_close3'>";
            html += "</div>";
            div.innerHTML = html;

            $('body')[0].appendChild(div);
            $('#btn_close3')[0].addEventListener("click", btnClose, false);
            $('#btn_ExportConfig')[0].addEventListener("click", function() {
                $('#configData')[0].innerText = sync_getConfigData();
            }, false);
            $('#btn_ImportConfig')[0].addEventListener("click", function() {
                var data = $('#configData')[0].innerText;
                if (data == null || data == "" || data == " ") {
                    alert("No data");
                    return;
                }
                try {
                    sync_setConfigData(data);
                    window.scroll(0, 0);
                    $('#sync_settings_overlay').fadeOut(400);
                    if (settings_show_save_message) {
                        showSaveForm();
                        $('#save_overlay_h3')[0].innerHTML = "imported";
                    }
                    reloadPage();
                } catch(e) {alert("Invalid format");}
            }, false);
            $('#btn_DBSave')[0].addEventListener("click", function() {
                gclh_sync_DBSave();
            }, false);
            $('#btn_DBLoad')[0].addEventListener("click", function() {
                gclh_sync_DBLoad().done(function() {reloadPage();});
            }, false);
            $('#syncDBLabel').click(function() {
                $('#syncDB').toggle();
                gclh_sync_DB_CheckAndCreateClient()
                    .done(function() {gclh_sync_DB_showSaveLoadLinks();})
                    .fail(function() {gclh_sync_DB_showAuthLink();});
            });
            $('#syncManualLabel').click(function() {
                $('#syncManual').toggle();
            });
        }
        if ($('.hover.open')[0]) $('.hover.open')[0].className = "";
    }

// Auto import.
    if (settings_sync_autoImport && (settings_sync_last.toString() === "Invalid Date" || (new Date() - settings_sync_last) > settings_sync_time) && document.URL.indexOf("#access_token") === -1) {
        gclh_sync_DBHash()
            .done(function(hash) {
                if (hash != settings_sync_hash) {
                    gclh_sync_DBLoad().done(function() {
                        settings_sync_last = new Date();
                        settings_sync_hash = hash;
                        setValue("settings_sync_last", settings_sync_last.toString()).done(function() {
                            setValue("settings_sync_hash", settings_sync_hash).done(function() {
                                if (is_page("profile")) reloadPage();
                            });
                        });
                    });
                }
            })
            .fail(function(error) {
                console.log('Autosync: Hash function was not successful:');
                console.log(error);
            });
    }

};  // End of mainGC.

//////////////////////////////
// Global Functions
//////////////////////////////
// Create bookmark to GC page.
function bookmark(title, href, bookmarkArray) {
    var bm = new Object();
    bookmarkArray[bookmarkArray.length] = bm;
    bm['href'] = href;
    bm['title'] = title;
    return bm;
}
// Create BM to external page.
function externalBookmark(title, href, bookmarkArray) {
    var bm = bookmark(title, href, bookmarkArray);
    bm['rel'] = "external";
    bm['target'] = "_blank";
}
// Create BM to a profile sub page.
function profileBookmark(title, id, bookmarkArray) {
    var bm = bookmark(title, "#", bookmarkArray);
    bm['id'] = id;
    bm['name'] = id;
}
// Create BM mit doppeltem Link.
function profileSpecialBookmark(title, href, name, bookmarkArray) {
    var bm = bookmark(title, href, bookmarkArray);
    bm['name'] = name;
}

// Matched the current document location the given path?
function isLocation(path) {
    path = path.toLowerCase();
    if (path.indexOf("http") != 0) {
        if (path.charAt(0) != '/') path = "/" + path;
        path = http + "://www.geocaching.com" + path;
    }
    return document.location.href.toLowerCase().indexOf(path) == 0;
}

// CSS Style hinzufügen.
function appendCssStyle(css, name) {
    if (css == "") return;
    if (name) var tag = $(name)[0];
    else var tag = $('head')[0];
    var style = document.createElement('style');
    style.innerHTML = 'GClhII{} ' + css;
    style.type = 'text/css';
    tag.appendChild(style);
}

// Logging.
function gclh_log(log) {
    var txt = "GClh_LOG - " + document.location.href + ": " + log;
    if (typeof(console) != "undefined") console.info(txt);
    else if (typeof(GM_log) != "undefined") GM_log(txt);
}

// Error Logging.
function gclh_error(modul, err) {
    var txt = "GClh_ERROR - " + modul + " - " + document.location.href + ": " + err.message + "\nStacktrace:\n" + err.stack + (err.stacktrace ? ("\n" + err.stacktrace) : "");
    if (typeof(console) != "undefined") console.error(txt);
    else if (typeof(GM_log) != "undefined") GM_log(txt);

    if ( settings_gclherror_alert ) {
        if ( $( "#gclh-gurumeditation" ).length == 0 ) {
            $("body").before('<div id="gclh-gurumeditation"></div>');
            $("#gclh-gurumeditation").append('<div style="border: 5px solid #ff0000;"></div>');
            $("#gclh-gurumeditation > div").append('<p style="font-weight: bold; font-size: x-large;">GC Little Helper II Error</p>');
            $("#gclh-gurumeditation > div").append('<div></div>');
            $("#gclh-gurumeditation > div").append('<p style="font-size: smaller;">For more information see the console. <a href="https://github.com/2Abendsegler/GClh/issues" target="_blank">Create a new issue / bug report at GitHub.</a></p>');
            var css = "";
            css += "#gclh-gurumeditation {";
            css += "    background-color:black;";
            css += "    padding: 5px;";
            css += "    color: red;";
            css += "    text-align: center;"
            css += "}";
            css += "#gclh-gurumeditation a:link, #gclh-gurumeditation a:visited, #gclh-gurumeditation a:hover {"
            css += "    color: red;";
            css += "    text-decoration: underline;"
            css += "}";
            css += "#gclh-gurumeditation > div > p {";
            css += "    margin: 0;";
            css += "    padding: 15px;";
            css += "    font-family:Arial;";
            css += "}";
            css += "#gclh-gurumeditation > div > div > p {";
            css += "    margin: 0;"
            css += "    font-family:Consolas,Monaco,Lucida Console,Liberation Mono,DejaVu Sans Mono,Bitstream Vera Sans Mono,Courier New, monospace;";
            css += "}";
            css += ".gclh_monospace {";
            css += "}";
            appendCssStyle(css);
        }
        $("#gclh-gurumeditation > div > div").append( "<p>"+modul + ": " + err.message+"</p>");
    }
}

// Zufallszahl zwischen max und min.
function random(max, min) {return Math.floor(Math.random() * (max - min + 1)) + min;}

// Set Get Values.
function setValue(name, value) {
    var defer = $.Deferred();
    CONFIG[name] = value;
    GM_setValue("CONFIG", JSON.stringify(CONFIG));
    defer.resolve();
    return defer.promise();
}
function setValueSet(data) {
    var defer = $.Deferred();
    var data2Store = {};
    for (key in data) {
        CONFIG[key] = data[key];
        data2Store[key] = data[key];
    }
    GM_setValue("CONFIG", JSON.stringify(CONFIG));
    defer.resolve();
    return defer.promise();
}
function getValue(name, defaultValue) {
    if (CONFIG[name] === undefined) {  // Zum Migrieren aus alten Speicherformat
        CONFIG[name] = GM_getValue(name, defaultValue);
        if (defaultValue === undefined) return undefined;
        setValue(name, CONFIG[name]);
    }
    return CONFIG[name];
}

// Auf welcher Seite bin ich?
function is_page(name) {
    var status = false;
    var url = document.location.pathname;
    switch (name) {
        case "cache_listing":
            if (url.match(/^\/(seek\/cache_details\.aspx|geocache\/)/) && !document.getElementById("cspSubmit") && !document.getElementById("cspGoBack")) status = true;
            // Exclude (new) Log Page
            if(url.match(/^\/(geocache\/).*\/log/)) status = false;
            // Exclude unpublished Caches
            if(document.getElementsByClassName('UnpublishedCacheSearchWidget').length > 0) status = false;
            break;
        case "profile":
            if (url.match(/^\/my(\/default\.aspx)?/)) status = true;
            break;
        case "publicProfile":
            if (url.match(/^\/(profile|p\/)/)) status = true;
            break;
        case "lists":
            if (url.match(/^\/plan\/lists/)) status = true;
            break;
        case "searchmap":
            if (url.match(/^\/play\/map/)) status = true;
            break;
        case "map":
            if (url.match(/^\/map/)) status = true;
            break;
        case "find_cache":
            if (url.match(/^\/play\/(search|geocache)/)) status = true;
            break;
        case "hide_cache":
            if (url.match(/^\/play\/(hide|friendleague|leaderboard|souvenircampaign|guidelines)/)) status = true;
            break;
        case "geotours":
            if (url.match(/^\/play\/geotours/)) status = true;
            break;
        case "drafts":
            if (url.match(/^\/account\/drafts/)) status = true;
            break;
        case "settings":
            if (url.match(/^\/account\/(settings|lists|drafts)/)) status = true;
            break;
        case "messagecenter":
            if (url.match(/^\/account\/messagecenter/)) status = true;
            break;
        case "dashboard":
            if (url.match(/^\/account\/dashboard$/)) status = true;
            break;
        case "dashboard-section":
            if (url.match(/^\/account\/dashboard/)) status = true;
            break;
        case "track":
            if (url.match(/^\/track\/($|#$)/)) status = true;
            break;
        case "souvenirs": /* only dashboard TODO public profile page */
            if (url.match(/^\/my\/souvenirs\.aspx/)) status = true;
            break;
        default:
            gclh_error("is_page", "is_page("+name+", ... ): unknown name");
            break;
    }
    return status;
}

// Inject script into site context.
function injectPageScript(scriptContent, TagName, IdName) {
    var script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    if ( IdName !== undefined ) {
        script.setAttribute("id", IdName);
    }
    script.innerHTML = scriptContent;
    var pageHead = document.getElementsByTagName(TagName?TagName:"head")[0];
    pageHead.appendChild(script);
}
function injectPageScriptFunction(funct, functCall) {injectPageScript("(" + funct.toString() + ")" + functCall + ";");}

// Meta Info hinzufügen.
function appendMetaId(id) {
    var head = document.getElementsByTagName('head')[0];
    var meta = document.createElement('meta');
    meta.id = id;
    head.appendChild(meta);
}

// Calculates difference between two dates and returns it as a "humanized" string (borrowed from http://userscripts.org/scripts/show/36353).
function adjustPlural(singularWord, timesNumber) {return singularWord + ((Math.abs(timesNumber) != 1) ? "s" : "");}
function getDateDiffString(dateNew, dateOld) {
    var dateDiff = new Date(dateNew - dateOld);
    dateDiff.setUTCFullYear(dateDiff.getUTCFullYear() - 1970);
    var strDateDiff = "", timeunitValue = 0;
    var timeunitsHash = {year: "getUTCFullYear", month: "getUTCMonth", day: "getUTCDate", hour: "getUTCHours", minute: "getUTCMinutes", second: "getUTCSeconds", millisecond: "getUTCMilliseconds"};
    for (var timeunitName in timeunitsHash) {
        timeunitValue = dateDiff[timeunitsHash[timeunitName]]() - ((timeunitName == "day") ? 1 : 0);
        if (timeunitValue !== 0) {
            if ((timeunitName == "millisecond") && (strDateDiff.length !== 0)) continue;  // Milliseconds won't be added unless difference is less than 1 second.
            strDateDiff += ((strDateDiff.length === 0) ? "" : ", ") + timeunitValue + " " + adjustPlural(timeunitName, timeunitValue);
        }
    }
    // Replaces last comma with "and" to humanize the string.
    strDateDiff = strDateDiff.replace(/,([^,]*)$/, " and$1");
    return strDateDiff;
}

// Get Geocaching Access Token
function gclh_GetGcAccessToken( handler ) {
    setTimeout(function() {
        $.ajax({
                type: "POST",
                url: "/account/oauth/token",
                timeout: 10000
            })
            .done( function(r) {
                try {
                    handler(r);
                } catch(e) {gclh_error("gclh_GetGcAccessToken()",e);}
            });
    }, 0);
}

start(this);
