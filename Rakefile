require 'open3'
require 'fileutils'

Encoding.default_external = 'UTF-8'

ROOT_DIR = File.dirname(__FILE__)

JS_DIR = "#{ROOT_DIR}/js"
CSS_DIR = "#{ROOT_DIR}/css"
LIB_DIR = "#{ROOT_DIR}/lib"
BUILD_DIR = "#{ROOT_DIR}/build"

JS_BUILD_FILE = 'tegaki.js'
CSS_BUILD_FILE = 'tegaki.css'

TEGAKI_LANG = if ENV['TEGAKI_LANG'] && ENV['TEGAKI_LANG'] =~ /\A[a-z]+\z/
  ENV['TEGAKI_LANG']
else
  'en'
end

NO_REPLAY = ENV['TEGAKI_NO_REPLAY'] == '1'

desc 'Concatenate JavaScript'
task :concat do
  if !File.directory?(BUILD_DIR)
    FileUtils.mkdir(BUILD_DIR)
  end
  
  out_file = "#{BUILD_DIR}/#{JS_BUILD_FILE}"
  
  src = String.new
  
  src << '/*! tegaki.js, MIT License */'
  
  src << "'use strict';"
  
  file = "#{JS_DIR}/strings/#{TEGAKI_LANG}.js"
  
  puts "<-- #{file}"
  
  src << File.binread(file)
  
  %w[
    tool
    brush
    pencil
    airbrush
    pen
    bucket
    tone
    pipette
    blur
    eraser
  ].each do |tool|
    file = "#{JS_DIR}/tools/#{tool}.js"
    puts "<-- #{file}"
    src << File.binread(file)
  end
  
  replay_src = [ 'replayrecorder.js', 'replayviewer.js' ]
  
  Dir.glob("#{JS_DIR}/*.js").each do |file|
    next if (NO_REPLAY && replay_src.include?(File.basename(file)))
    puts "<-- #{file}"
    src << File.binread(file)
  end
  
  if !NO_REPLAY
    file = "#{LIB_DIR}/UZIP/UZIP.js"
    puts "<-- #{file}"
    src << File.binread(file)
  end
  
  File.binwrite(out_file, src)
  
  puts "\n--> #{out_file}"
end

desc 'Minify JavaScript and CSS'
task :minify => ['minify:js'] #, 'minify:css']

namespace :minify do
  desc 'Minify JavaScript'
  task :js do
    require 'uglifier'
    
    file = "#{BUILD_DIR}/#{JS_BUILD_FILE}"
    
    if !File.exist?(file)
      abort("#{file} not found. Run 'rake concat' first")
    end
    
    min_file = "#{BUILD_DIR}/#{File.basename(JS_BUILD_FILE, '.js')}.min.js"
    
    u = Uglifier.new({
      :compress => {
        :drop_console => true
      },
      
      :output => {
        :comments => /^\/*!/
      },
      
      :harmony => true,
    })
    
    js = u.compile(File.read(file))
    
    File.binwrite(min_file, js)
    
    puts "--> #{min_file}"
  end

  desc 'Minify CSS'
  task :css do
    file = "#{CSS_DIR}/#{CSS_BUILD_FILE}"
    
    min_file = "#{CSS_DIR}/#{File.basename(JS_BUILD_FILE, '.js')}.min.css"
    
    output, outerr, status = Open3.capture3('cleancss', '-o', min_file, file)
    
    if status != 0
      puts outerr
      abort
    end
    
    puts "--> #{min_file}"
  end
end

desc 'Run JShint'
task :jshint do
  Dir.glob("#{JS_DIR}/**/*.js").each do |file|
    puts "--> #{File.basename(file)}"
    output, outerr, status = Open3.capture3('jshint', file)
    
    if outerr != ''
      puts outerr
      abort
    else
      puts output
    end
  end
end

task :default => [:concat]
