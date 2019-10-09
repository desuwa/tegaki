require 'open3'

Encoding.default_external = 'UTF-8'

ROOT_DIR = File.dirname(__FILE__)

SRC_DIR = "#{ROOT_DIR}/js"

JS_BUILD_FILE = 'tegaki.js'
CSS_BUILD_FILE = 'tegaki.css'

TEGAKI_LANG = if ENV['TEGAKI_LANG'] && ENV['TEGAKI_LANG'] =~ /\A[a-z]+\z/
  ENV['TEGAKI_LANG']
else
  'en'
end

desc 'Concatenate JavaScript'
task :concat do
  out_file = "#{ROOT_DIR}/#{JS_BUILD_FILE}"
  
  src = String.new
  
  src << "'use strict';"
  
  file = "#{SRC_DIR}/strings/#{TEGAKI_LANG}.js"
  
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
    file = "#{SRC_DIR}/tools/#{tool}.js"
    puts "<-- #{file}"
    src << File.binread(file)
  end
  
  Dir.glob("#{SRC_DIR}/*.js").each do |file|
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
    
    file = "#{ROOT_DIR}/#{JS_BUILD_FILE}"
    
    if !File.exist?(file)
      abort("#{JS_BUILD_FILE} not found. Run 'rake concat' first")
    end
    
    min_file = "#{ROOT_DIR}/#{File.basename(JS_BUILD_FILE, '.js')}.min.js"
    
    u = Uglifier.new({
      :compress => {
        :drop_console => true
      },
      
      :harmony => true,
    })
    
    js = u.compile(File.read(file))
    
    File.binwrite(min_file, js)
    
    puts "--> #{min_file}"
  end

  desc 'Minify CSS'
  task :css do
    file = "#{ROOT_DIR}/#{CSS_BUILD_FILE}"
    
    min_file = "#{ROOT_DIR}/#{File.basename(JS_BUILD_FILE, '.js')}.min.css"
    
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
  Dir.glob("#{SRC_DIR}/**/*.js").each do |file|
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

task :jshint_build do
  output, outerr, status = Open3.capture3('jshint', "#{ROOT_DIR}/#{JS_BUILD_FILE}")
  
  if outerr != ''
    puts outerr
    abort
  else
    puts output
  end
end

task :default => [:concat]
