this["Template"] = this["Template"] || {};

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