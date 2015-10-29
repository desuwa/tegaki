Encoding.default_external = 'UTF-8'

desc 'Run JShint'
task :jshint do |t|
  require 'jshintrb'
  
  opts = {
    laxbreak: true,
    boss: true,
    expr: true,
    sub: true,
    browser: true,
    devel: true,
    globalstrict: true,
    unused: true,
    '-W079' => true # no-native-reassign
  }
  
  puts Jshintrb.report("'use strict';" + File.read('tegaki.js'), opts)
end
