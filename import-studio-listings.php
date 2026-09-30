<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require __DIR__.'/db.php';
$rows=json_decode(file_get_contents(__DIR__.'/studio-sources.json'),true,512,JSON_THROW_ON_ERROR);
$db=database();
$db->beginTransaction();
try{
 $check=$db->prepare('SELECT id,image_data FROM studios WHERE slug=?');
 $insert=$db->prepare('INSERT INTO studios (slug,name,city,address,description,specialties,latitude,longitude,phone,facebook,instagram,image_data,capabilities,is_demo,is_active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,0,1)');
 $fillImage=$db->prepare("UPDATE studios SET image_data=? WHERE id=? AND (image_data IS NULL OR image_data='')");
 foreach($rows as $r){
  $image=null;
  if(!empty($r['image_file'])){
   $path=realpath(__DIR__.'/'.$r['image_file']);$base=realpath(__DIR__.'/assets/studios');
   if(!$path||!$base||!str_starts_with($path,$base.DIRECTORY_SEPARATOR))throw new RuntimeException('Invalid studio image path.');
   $bytes=file_get_contents($path);$info=getimagesizefromstring($bytes);
   if(!$info||!in_array($info['mime'],['image/jpeg','image/png'],true)||strlen($bytes)>2097152)throw new RuntimeException('Invalid studio image.');
   $image='data:'.$info['mime'].';base64,'.base64_encode($bytes);
   if(!hash_equals($r['image_sha256'],hash('sha256',$image)))throw new RuntimeException('Image source fingerprint mismatch.');
  }
  $check->execute([$r['slug']]);$existing=$check->fetch();
  if($existing){
   if($image&&empty($existing['image_data'])){$fillImage->execute([$image,$existing['id']]);echo "Added cover: {$r['name']}\n";}
   else echo "Existing listing preserved: {$r['name']}\n";
   continue;
  }
  $insert->execute([$r['slug'],$r['name'],$r['city'],$r['address'],$r['description'],json_encode($r['specialties']),$r['latitude'],$r['longitude'],$r['phone'],$r['facebook'],$r['instagram'],$image,'{}']);
  echo "Added: {$r['name']}\n";
 }
 $db->commit();
}catch(Throwable $e){if($db->inTransaction())$db->rollBack();throw $e;}
