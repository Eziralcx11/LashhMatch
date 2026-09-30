<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
$manifest=json_decode(file_get_contents(__DIR__.'/cover-prompts.json'),true,512,JSON_THROW_ON_ERROR);
foreach($manifest as $r){
 $source=__DIR__.'/'.$r['slug'].'-illustration.png';
 $target=__DIR__.'/'.$r['slug'].'-illustration.jpg';
 $image=imagecreatefrompng($source);
 if(!$image||!imagejpeg($image,$target,86))throw new RuntimeException('Could not encode cover.');
 imagedestroy($image);
}
