this["Template"] = this["Template"] || {};

this["Template"]["borroweds_history_item"] = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (Date, accession_no, book_url, created_at, name, return_date, type) {
buf.push("<tr><td>" + (jade.escape((jade_interp = new Date(created_at).toLocaleDateString()) == null ? '' : jade_interp)) + "</td><td>" + (jade.escape((jade_interp = new Date(return_date).toLocaleDateString()) == null ? '' : jade_interp)) + "</td><td><a" + (jade.attr("href", book_url, true, false)) + ">" + (jade.escape((jade_interp = name) == null ? '' : jade_interp)) + "</a></td><td>" + (jade.escape((jade_interp = type) == null ? '' : jade_interp)) + "</td><td>" + (jade.escape((jade_interp = accession_no) == null ? '' : jade_interp)) + "</td></tr>");}.call(this,"Date" in locals_for_with?locals_for_with.Date:typeof Date!=="undefined"?Date:undefined,"accession_no" in locals_for_with?locals_for_with.accession_no:typeof accession_no!=="undefined"?accession_no:undefined,"book_url" in locals_for_with?locals_for_with.book_url:typeof book_url!=="undefined"?book_url:undefined,"created_at" in locals_for_with?locals_for_with.created_at:typeof created_at!=="undefined"?created_at:undefined,"name" in locals_for_with?locals_for_with.name:typeof name!=="undefined"?name:undefined,"return_date" in locals_for_with?locals_for_with.return_date:typeof return_date!=="undefined"?return_date:undefined,"type" in locals_for_with?locals_for_with.type:typeof type!=="undefined"?type:undefined));;return buf.join("");
};

this["Template"]["borroweds_item"] = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (Date, Math, accession_no, book_url, created_at, due_date, max_times_renewals, name, renewals_times, status, type) {
buf.push("<tr><td> ");
if ( status === 'overdue')
{
buf.push("<span class=\"danger\">超期</span>");
}
else if ( renewals_times === max_times_renewals)
{
buf.push("<span class=\"danger\">续满</span>");
}
else
{
buf.push("<input type=\"checkbox\" name=\"accession_no\"" + (jade.attr("value", accession_no, true, false)) + "/>");
}
buf.push("</td>");
var _due_date = new Date(due_date);
var _created_at = new Date(created_at);
buf.push("<td>" + (jade.escape((jade_interp = _due_date.toLocaleDateString()) == null ? '' : jade_interp)) + "</td><td>" + (jade.escape((jade_interp = _created_at.toLocaleDateString()) == null ? '' : jade_interp)) + "</td><td><a" + (jade.attr("href", book_url, true, false)) + ">" + (jade.escape((jade_interp = name) == null ? '' : jade_interp)) + "</a></td><td>" + (jade.escape((jade_interp = type) == null ? '' : jade_interp)) + "</td><td>" + (jade.escape((jade_interp = accession_no) == null ? '' : jade_interp)) + "</td>");
var one_day = 1000*60*60*24;
var days = Math.round((_due_date.getTime() - Date.now()) / one_day);
if ( days >= 0)
{
buf.push("<td class=\"success\">还有" + (jade.escape((jade_interp = days) == null ? '' : jade_interp)) + "天到期</td>");
}
else
{
buf.push("<td class=\"danger\">已超期" + (jade.escape((jade_interp = Math.abs(days)) == null ? '' : jade_interp)) + "天</td>");
}
buf.push("</tr>");}.call(this,"Date" in locals_for_with?locals_for_with.Date:typeof Date!=="undefined"?Date:undefined,"Math" in locals_for_with?locals_for_with.Math:typeof Math!=="undefined"?Math:undefined,"accession_no" in locals_for_with?locals_for_with.accession_no:typeof accession_no!=="undefined"?accession_no:undefined,"book_url" in locals_for_with?locals_for_with.book_url:typeof book_url!=="undefined"?book_url:undefined,"created_at" in locals_for_with?locals_for_with.created_at:typeof created_at!=="undefined"?created_at:undefined,"due_date" in locals_for_with?locals_for_with.due_date:typeof due_date!=="undefined"?due_date:undefined,"max_times_renewals" in locals_for_with?locals_for_with.max_times_renewals:typeof max_times_renewals!=="undefined"?max_times_renewals:undefined,"name" in locals_for_with?locals_for_with.name:typeof name!=="undefined"?name:undefined,"renewals_times" in locals_for_with?locals_for_with.renewals_times:typeof renewals_times!=="undefined"?renewals_times:undefined,"status" in locals_for_with?locals_for_with.status:typeof status!=="undefined"?status:undefined,"type" in locals_for_with?locals_for_with.type:typeof type!=="undefined"?type:undefined));;return buf.join("");
};

this["Template"]["card_no_inputer"] = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (name, title, value) {
buf.push("<div class=\"window-label\">" + (jade.escape((jade_interp = title) == null ? '' : jade_interp)) + "</div><input type=\"text\"" + (jade.attr("name", name, true, false)) + (jade.attr("value", value, true, false)) + " class=\"window-input\"/>");}.call(this,"name" in locals_for_with?locals_for_with.name:typeof name!=="undefined"?name:undefined,"title" in locals_for_with?locals_for_with.title:typeof title!=="undefined"?title:undefined,"value" in locals_for_with?locals_for_with.value:typeof value!=="undefined"?value:undefined));;return buf.join("");
};

this["Template"]["comment_item"] = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (avatar, comment_id, content, current_userid, date, liked, likes, rank, reply_id, reply_username, url_for_reply_user, url_for_user, user_id, username) {
buf.push("<!--Template.comment_item--><div" + (jade.attr("data-user", username, true, false)) + (jade.attr("data-userid", user_id, true, false)) + (jade.attr("data-id", comment_id, true, false)) + (jade.attr("id", comment_id, true, false)) + (jade.attr("data-likes", likes, true, false)) + " class=\"comment-item clearfix\"><div class=\"comment-avatar\"><img" + (jade.attr("src", avatar, true, false)) + (jade.attr("alt", username, true, false)) + "/></div><div class=\"comment-item-header\"><div class=\"comment-id\">#" + (jade.escape((jade_interp = comment_id) == null ? '' : jade_interp)) + "</div><div class=\"username\"><a" + (jade.attr("href", url_for_user, true, false)) + " class=\"user\">" + (jade.escape((jade_interp = username) == null ? '' : jade_interp)) + "</a></div><div class=\"comment-date\">" + (jade.escape((jade_interp = date.toDateString()) == null ? '' : jade_interp)) + "</div>");
if ( rank !== 0)
{
buf.push("<div class=\"comment-star\"><div" + (jade.cls(['star','pull-left','star-'+rank], [null,null,true])) + "></div></div>");
}
buf.push("<div class=\"comment-reply comment-icon\"><span class=\"glyphicon glyphicon-share-alt\"></span></div><div" + (jade.attr("data-liked", liked, true, false)) + " class=\"comment-agree comment-icon\"><span class=\"glyphicon glyphicon-thumbs-up\"></span><span class=\"ups\">");
if ( likes > 0)
{
buf.push(jade.escape(null == (jade_interp = likes) ? "" : jade_interp));
}
if ( liked)
{
buf.push("取消赞");
}
buf.push("</span></div>");
if ( current_userid === user_id  )
{
buf.push("<div class=\"comment-delete comment-icon\"><span class=\"glyphicon glyphicon-remove\"></span></div>");
}
buf.push("</div><div class=\"comment-item-body\">");
if ( reply_id)
{
buf.push("<div class=\"parent-id\">回复: #" + (jade.escape((jade_interp = reply_id) == null ? '' : jade_interp)) + "</div>");
}
if ( reply_username)
{
buf.push("<div class=\"parent-username\"><a" + (jade.attr("href", url_for_reply_user, true, false)) + " class=\"user\">" + (jade.escape((jade_interp = reply_username) == null ? '' : jade_interp)) + "</a></div>");
}
buf.push("<div class=\"comment-item-content\">" + (jade.escape(null == (jade_interp = content) ? "" : jade_interp)) + "</div></div></div>");}.call(this,"avatar" in locals_for_with?locals_for_with.avatar:typeof avatar!=="undefined"?avatar:undefined,"comment_id" in locals_for_with?locals_for_with.comment_id:typeof comment_id!=="undefined"?comment_id:undefined,"content" in locals_for_with?locals_for_with.content:typeof content!=="undefined"?content:undefined,"current_userid" in locals_for_with?locals_for_with.current_userid:typeof current_userid!=="undefined"?current_userid:undefined,"date" in locals_for_with?locals_for_with.date:typeof date!=="undefined"?date:undefined,"liked" in locals_for_with?locals_for_with.liked:typeof liked!=="undefined"?liked:undefined,"likes" in locals_for_with?locals_for_with.likes:typeof likes!=="undefined"?likes:undefined,"rank" in locals_for_with?locals_for_with.rank:typeof rank!=="undefined"?rank:undefined,"reply_id" in locals_for_with?locals_for_with.reply_id:typeof reply_id!=="undefined"?reply_id:undefined,"reply_username" in locals_for_with?locals_for_with.reply_username:typeof reply_username!=="undefined"?reply_username:undefined,"url_for_reply_user" in locals_for_with?locals_for_with.url_for_reply_user:typeof url_for_reply_user!=="undefined"?url_for_reply_user:undefined,"url_for_user" in locals_for_with?locals_for_with.url_for_user:typeof url_for_user!=="undefined"?url_for_user:undefined,"user_id" in locals_for_with?locals_for_with.user_id:typeof user_id!=="undefined"?user_id:undefined,"username" in locals_for_with?locals_for_with.username:typeof username!=="undefined"?username:undefined));;return buf.join("");
};