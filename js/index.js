var Footer = {
  init:function(){
    this.$footer = $('footer')
    this.$ul = this.$footer.find('ul')
    this.$box = this.$footer.find('.box')
    this.$leftBtn = this.$footer.find('.icon-left')
    this.$rightBtn = this.$footer.find('.icon-right')
    this.isToEnd = false
    this.isToStart = true
    this.isAnimate = false

    this.bind()
    this.render()
  },

  bind:function(){
    var _this = this
    $(window).resize(function(){
      _this.setStyle()
    })
    this.$rightBtn.on('click',function(){
      if(_this.isAnimate) return
      var itemWidth = _this.$box.find('li').outerWidth(true)
      var rowCount = Math.floor(_this.$box.width()/itemWidth)

      if(!_this.isToEnd){
        _this.isAnimate = true
        _this.$ul.animate({
          left:'-='+rowCount * itemWidth
        },400,function(){
          _this.isAnimate = false
          _this.isToStart = false
          if(parseInt(_this.$box.width()) - parseInt(_this.$ul.css('left')) >= _this.$ul.width()){
            _this.isToEnd = true
            // _this.$rightBtn.addClass('disabled')
          }
        })
      }
    })

    this.$leftBtn.on('click',function(){
      if(_this.isAnimate) return
      var itemWidth = _this.$box.find('li').outerWidth(true)
      var rowCount = Math.floor(_this.$box.width()/itemWidth)
      if(!_this.isToStart){
        _this.isAnimate = true
        _this.$ul.animate({
          left:'+='+rowCount * itemWidth
        },400,function(){
          _this.isAnimate = false
          _this.isToEnd = false
          if(parseInt(_this.$ul.css('left')) >= 0){
            _this.isToStart = true
            // _this.$leftBtn.addClass('disabled')
          }
        })
      }
    })

    this.$footer.on('click','li',function(){
      $(this).addClass('active')
            .siblings().removeClass('active')

    EventCenter.fire('select-albumn',{
      channelId:$(this).attr('data-channel-id'),
      channelName:$(this).attr('data-channel-name')
  })
    })
  },

  render:function(){
    var _this = this
    $.getJSON('//api.jirengu.com/fm/getChannels.php')
      .done(function(ret){
      _this.renderFooter(ret.channels)
    }).fail(function(error){
      console.log('error');
    })
  },

  renderFooter:function(channels){
    var html = ''
    channels.forEach(function(channel){
      html += '<li data-channel-id='+channel.channel_id+' data-channel-name='+channel.name+'>'
            + ' <div class="cover" style="background-image:url('+channel.cover_small+')"></div>'
            + ' <h3>'+channel.name+'</h3>'
            + '</li>'
    })
    this.$ul.html(html)
    this.setStyle()
  },

  setStyle:function(){
    var count = this.$footer.find('li').length
    var width = this.$footer.find('li').outerWidth(true)
    this.$ul.css({
      width:count * width + 'px'
    })
  }
}
Footer.init()

var EventCenter = (function(){

     var events = {}; // 储存所有的key与value

     function on(evt,handler){
         events[evt] = events[evt] || [];
         events[evt].push({
             handler:handler
         })
     }

     function fire(evt,args){
         if(!events[evt]){ //没有订阅就不执行
            return;
         }
         for(var i=0; i<events[evt].length; i++){
             events[evt][i].handler(args);
         }
     }

     return{
         on:on,   // 订阅
         fire:fire   // 触发
     }
})()

var Fm = {
  init:function(){
    this.$container = $('#page-music')
    this.audio = new Audio()
    this.audio.autoplay = true

    this.bind()
  },

  bind:function(){
    var _this = this
    $(document).ready(function(){
      _this.loadMusic()
      _this.audio.play()
    })

    EventCenter.on('select-albumn',function(channelObj){
      _this.channelId = channelObj.channelId
      _this.channelName = channelObj.channelName
      _this.loadMusic()
    })

    this.$container.find('.btn-play').on('click',function(){
      _this.$container[0].querySelector('.btn-play').classList.toggle('active')
      _this.$container[0].querySelector('.btn-pause').classList.toggle('active')
      _this.audio.play()
    })
    this.$container.find('.btn-pause').on('click',function(){
      _this.$container[0].querySelector('.btn-play').classList.toggle('active')
      _this.$container[0].querySelector('.btn-pause').classList.toggle('active')
      _this.audio.pause()
    })

    this.$container.find('.btn-next').on('click',function(){
      _this.loadMusic()
    })

    this.audio.addEventListener('play',function(){
      console.log('play')
      clearInterval(_this.statusClock)
      _this.statusClock = setInterval(function(){
        _this.updateStatus()
      },1000)
    })
    this.audio.addEventListener('pause',function(){
      console.log('pause')
      clearInterval(_this.statusClock)
    })
  },

  loadMusic(){
    var _this = this
    $.getJSON('//api.jirengu.com/fm/getSong.php',{channel:this.channelId}).done(function(ret){
      _this.song = ret['song'][0]
      _this.setMusic()
      _this.loadLyric()
    })
  },

  loadLyric(){
    var _this = this

    $.getJSON('//api.jirengu.com/fm/getLyric.php',{sid:this.song.sid}).done(function(ret){
      var lyric = ret.lyric
      var lyricObj = {}
      lyric.split('\n').forEach(function(line){
        var times = line.match(/\d{2}:\d{2}/) //时间
        var str = line.replace(/\[.+?\]/g,'') //歌词
        if(Array.isArray(times)){          //过滤空的歌词
          times.forEach(function(time){
            lyricObj[time] = str
          })
        }
      })
      _this.lyricObj = lyricObj
    })
  },

  setMusic(){
    this.audio.src = this.song.url
    $('.bg').css('background-image','url('+this.song.picture+')')
    this.$container.find('.aside figure').css('background-image','url('+this.song.picture+')')
    this.$container.find('.detail h1').text(this.song.title)
    this.$container.find('.detail .author').text(this.song.artist)
    this.$container.find('.detail .tag').text(this.channelName || '秋日私语')

    this.$container[0].querySelector('.btn-play').classList.remove('active')
    this.$container[0].querySelector('.btn-pause').classList.remove('active')
  },

  updateStatus(){
    console.log('update...')
    var min = Math.floor(this.audio.currentTime/60)
    var second = Math.floor(this.audio.currentTime%60)+''
    second = second.length === 2 ? second:'0'+second
    this.$container.find('.current-time').text(min+':'+second)
    this.$container.find('.bar-progress').css('width',this.audio.currentTime/this.audio.duration*100+'%')
                                                                      // 5/10 = 0.5 0.5*100
    var line = this.lyricObj['0'+min+':'+second]
    if(line){
      this.$container.find('.lyric p').text(line).boomText()
    }

  }
}
Fm.init()


// jq插件
$.fn.boomText = function(type){
  type = type || 'rollIn'
  this.html(function(){
    var arr = $(this).text()
    .split('').map(function(word){
      return '<span class="boomText">'+word+'</span>'
    })
    return arr.join('')
  })

  var index = 0
  var $boomTexts = $(this).find('span')
  var clock = setInterval(function(){
    $boomTexts.eq(index).addClass('animated '+type)
    index++
    if(index >= $boomTexts.length){
      clearInterval(clock)
    }
  },300)
}
