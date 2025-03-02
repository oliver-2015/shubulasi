let scene, camera, renderer, player, dinosaur;
let health = 5;
let maxHealth = 100;
let attackPower = 1;
let dinosaurHealth = 100;
let level = 1;
let score = 0;
let bullets = [];
let bulletSpeed = 0.5;

// 修改跳跃相关变量
let isJumping = false;
let jumpVelocity = 0;
const jumpHeight = 6;  // 原来是3，增加一倍
const gravity = 0.075;  // 原来是0.15，降低一半

// 添加按键状态对象
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    ' ': false,  // 空格键
    z: false,    // 小写z
    Z: false,    // 大写Z
    'g': false,    // 手雷按键
    'G': false
};

// 添加射击冷却相关变量
let canShoot = true;
const shootCooldown = 500; // 射击冷却时间（毫秒）

// 修改移动速度
const moveSpeed = 0.125; // 原来是0.5，改为1/4

// 添加地面范围限制
const groundLimit = 24; // 地面大小是50，留一点边距

// 添加恐龙相关变量
const dinosaurSpeed = moveSpeed * 1.1; // 恐龙速度是玩家速度的1.1倍
let dinosaurCanMove = true; // 控制恐龙是否可以移动

// 修改手雷相关变量
let grenades = [];
const grenadeSpeed = 0.3;
const grenadeDamage = 10;  // 将伤害从2提高到10
let canThrowGrenade = true;
const grenadeCooldown = 2000; // 2秒冷却时间

// 初始化场景
function init() {
    // 创建场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    
    // 创建相机
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 创建地面（草地颜色）
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x2d5a27,  // 深草绿色
        shininess: 10,
        side: THREE.DoubleSide 
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    scene.add(ground);

    // 创建玩家（人类形态）
    const playerGroup = new THREE.Group();

    // 头部
    const headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xffccaa }); // 肤色
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 0.8;
    playerGroup.add(head);

    // 头发
    const hairGeometry = new THREE.BoxGeometry(0.42, 0.15, 0.42); // 稍微减小高度，宽度略小于头部
    const hairMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 }); // 黑色头发
    const hair = new THREE.Mesh(hairGeometry, hairMaterial);
    hair.position.y = 0.2; // 降低位置，更贴近头部
    head.add(hair);

    // 眼睛
    const eyeGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 }); // 黑色眼睛
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.1, 0, 0.2);
    head.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.1, 0, 0.2);
    head.add(rightEye);

    // 嘴巴
    const mouthGeometry = new THREE.BoxGeometry(0.1, 0.03, 0.08);
    const mouthMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 }); // 褐色
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, -0.1, 0.2);
    head.add(mouth);

    // 身体
    const bodyGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.3);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 }); // 红色衣服
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.2;
    playerGroup.add(body);

    // 左腿
    const legGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
    const legMaterial = new THREE.MeshPhongMaterial({ color: 0x0000ff }); // 蓝色裤子
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.15, -0.3, 0);
    playerGroup.add(leftLeg);

    // 左鞋
    const shoeGeometry = new THREE.BoxGeometry(0.22, 0.1, 0.3);
    const shoeMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 }); // 深灰色鞋子
    const leftShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
    leftShoe.position.y = -0.35;
    leftShoe.position.z = 0.05;
    leftLeg.add(leftShoe);

    // 右腿
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.15, -0.3, 0);
    playerGroup.add(rightLeg);

    // 右鞋
    const rightShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
    rightShoe.position.y = -0.35;
    rightShoe.position.z = 0.05;
    rightLeg.add(rightShoe);

    // 左手臂
    const armGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
    const leftArm = new THREE.Mesh(armGeometry, headMaterial); // 使用肤色
    leftArm.position.set(-0.4, 0.3, 0);
    playerGroup.add(leftArm);

    // 右手臂（持枪的手）
    const rightArm = new THREE.Mesh(armGeometry, headMaterial);
    rightArm.position.set(0.4, 0.3, 0);
    playerGroup.add(rightArm);

    // 添加手枪到右手
    const gunGroup = new THREE.Group();

    // 枪身
    const gunBodyGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.15);
    const gunMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const gunBody = new THREE.Mesh(gunBodyGeometry, gunMaterial);
    gunGroup.add(gunBody);

    // 枪管
    const barrelGeometry = new THREE.BoxGeometry(0.3, 0.12, 0.12);
    const barrel = new THREE.Mesh(barrelGeometry, gunMaterial);
    barrel.position.x = 0.3;
    gunGroup.add(barrel);

    // 握把
    const gripGeometry = new THREE.BoxGeometry(0.15, 0.4, 0.15);
    const grip = new THREE.Mesh(gripGeometry, gunMaterial);
    grip.position.y = -0.2;
    gunGroup.add(grip);

    // 将手枪添加到右手位置
    gunGroup.position.set(0.6, 0.3, 0.2);
    rightArm.add(gunGroup);

    player = playerGroup;
    scene.add(player);

    // 创建恐龙（更详细的恐龙形态）
    const dinosaurGroup = new THREE.Group();

    // 身体躯干
    const dinoBodyGeometry = new THREE.BoxGeometry(2, 1.5, 3);
    const dinosaurMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 }); // 深绿色
    const dinoBody = new THREE.Mesh(dinoBodyGeometry, dinosaurMaterial);
    dinoBody.position.y = 1;
    dinosaurGroup.add(dinoBody);

    // 头部
    const dinoHeadGeometry = new THREE.BoxGeometry(0.8, 0.8, 1.2);
    const dinoHead = new THREE.Mesh(dinoHeadGeometry, dinosaurMaterial);
    dinoHead.position.set(0, 1.8, 1.8);
    dinosaurGroup.add(dinoHead);

    // 眼睛
    const dinoEyeGeometry = new THREE.SphereGeometry(0.1);
    const dinoEyeMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.5
    }); // 发光的红色眼睛
    const dinoLeftEye = new THREE.Mesh(dinoEyeGeometry, dinoEyeMaterial);
    dinoLeftEye.position.set(-0.2, 1.9, 2.2);
    dinosaurGroup.add(dinoLeftEye);

    const dinoRightEye = new THREE.Mesh(dinoEyeGeometry, dinoEyeMaterial);
    dinoRightEye.position.set(0.2, 1.9, 2.2);
    dinosaurGroup.add(dinoRightEye);

    // 嘴巴（上颌）
    const dinoUpperJawGeometry = new THREE.BoxGeometry(0.6, 0.3, 1.0);
    const dinoUpperJaw = new THREE.Mesh(dinoUpperJawGeometry, dinosaurMaterial);
    dinoUpperJaw.position.set(0, 1.7, 2.5);
    dinosaurGroup.add(dinoUpperJaw);

    // 嘴巴（下颌）
    const dinoLowerJawGeometry = new THREE.BoxGeometry(0.5, 0.2, 0.9);
    const dinoLowerJaw = new THREE.Mesh(dinoLowerJawGeometry, dinosaurMaterial);
    dinoLowerJaw.position.set(0, 1.5, 2.5);
    dinosaurGroup.add(dinoLowerJaw);

    // 牙齿
    const dinoTeethGeometry = new THREE.ConeGeometry(0.05, 0.1, 4);
    const dinoTeethMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    for(let i = 0; i < 6; i++) {
        const tooth = new THREE.Mesh(dinoTeethGeometry, dinoTeethMaterial);
        tooth.rotation.x = Math.PI;
        tooth.position.set(-0.15 + i * 0.06, 1.55, 2.7);
        dinosaurGroup.add(tooth);
    }

    // 前爪（两只）
    const dinoClawGeometry = new THREE.BoxGeometry(0.4, 0.8, 0.4);
    const dinoLeftClaw = new THREE.Mesh(dinoClawGeometry, dinosaurMaterial);
    dinoLeftClaw.position.set(-1.2, 1.0, 0.8);
    dinosaurGroup.add(dinoLeftClaw);

    // 左前爪尖端
    const dinoClawTipGeometry = new THREE.ConeGeometry(0.1, 0.3, 4);
    const dinoClawTipMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    const leftClawTip1 = new THREE.Mesh(dinoClawTipGeometry, dinoClawTipMaterial);
    leftClawTip1.rotation.x = -Math.PI / 2;
    leftClawTip1.position.set(0, -0.5, 0.1);
    dinoLeftClaw.add(leftClawTip1);

    const dinoRightClaw = new THREE.Mesh(dinoClawGeometry, dinosaurMaterial);
    dinoRightClaw.position.set(1.2, 1.0, 0.8);
    dinosaurGroup.add(dinoRightClaw);

    // 右前爪尖端
    const rightClawTip1 = new THREE.Mesh(dinoClawTipGeometry, dinoClawTipMaterial);
    rightClawTip1.rotation.x = -Math.PI / 2;
    rightClawTip1.position.set(0, -0.5, 0.1);
    dinoRightClaw.add(rightClawTip1);

    // 后腿（两只）
    const dinoLegGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.8);
    const dinoLeftLeg = new THREE.Mesh(dinoLegGeometry, dinosaurMaterial);
    dinoLeftLeg.position.set(-0.8, 0.2, -0.8);
    dinosaurGroup.add(dinoLeftLeg);

    // 左后爪
    const leftFootClaw = new THREE.Mesh(dinoClawTipGeometry, dinoClawTipMaterial);
    leftFootClaw.rotation.x = -Math.PI / 2;
    leftFootClaw.scale.set(1.5, 1.5, 1.5);
    leftFootClaw.position.set(0, -0.7, 0.2);
    dinoLeftLeg.add(leftFootClaw);

    const dinoRightLeg = new THREE.Mesh(dinoLegGeometry, dinosaurMaterial);
    dinoRightLeg.position.set(0.8, 0.2, -0.8);
    dinosaurGroup.add(dinoRightLeg);

    // 右后爪
    const rightFootClaw = new THREE.Mesh(dinoClawTipGeometry, dinoClawTipMaterial);
    rightFootClaw.rotation.x = -Math.PI / 2;
    rightFootClaw.scale.set(1.5, 1.5, 1.5);
    rightFootClaw.position.set(0, -0.7, 0.2);
    dinoRightLeg.add(rightFootClaw);

    dinosaur = dinosaurGroup;
    dinosaur.position.x = 10;
    scene.add(dinosaur);

    // 添加光照
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // 修改键盘事件监听
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // 开始生成食物和材料
    spawnFood();
    spawnMaterial();
    setInterval(spawnFood, 30000);  // 每30秒生成食物
    setInterval(spawnMaterial, 300000);  // 每300秒生成材料

    // 开始恐龙的移动
    moveDinosaur();

    // 在最后添加初始UI更新
    updateUI();
    
    // 开始动画循环
    animate();
}

// 按键按下
function onKeyDown(event) {
    if (keys.hasOwnProperty(event.key)) {
        keys[event.key] = true;
    }
}

// 按键释放
function onKeyUp(event) {
    if (keys.hasOwnProperty(event.key)) {
        keys[event.key] = false;
    }
}

// 射击功能
function shoot() {
    if (!canShoot) return;  // 如果在冷却中，直接返回
    
    // 获取右手臂和手枪
    const rightArm = player.children.find(child => child.position.x === 0.4);
    const gunGroup = rightArm.children[0];
    
    // 创建子弹
    const bulletGeometry = new THREE.SphereGeometry(0.1);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    
    // 设置子弹初始位置（枪口位置）
    const gunTip = new THREE.Vector3(0.7, 0.3, 0.2);
    gunTip.applyQuaternion(rightArm.quaternion);
    gunTip.add(player.position);
    bullet.position.copy(gunTip);
    
    // 设置子弹速度（朝向恐龙）
    const direction = new THREE.Vector3();
    direction.subVectors(dinosaur.position, bullet.position).normalize();
    bullet.velocity = direction.multiplyScalar(bulletSpeed);
    
    scene.add(bullet);
    bullets.push(bullet);
    
    // 添加枪口闪光
    createMuzzleFlash(gunTip);
    
    // 设置射击冷却
    canShoot = false;
    setTimeout(() => {
        canShoot = true;
    }, shootCooldown);
}

// 创建子弹
function createBullet() {
    const bulletGeometry = new THREE.SphereGeometry(0.1);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    
    bullet.position.copy(player.position);
    bullet.position.y += 0.5;
    
    const direction = new THREE.Vector3();
    direction.subVectors(dinosaur.position, player.position).normalize();
    bullet.velocity = direction.multiplyScalar(bulletSpeed);
    
    scene.add(bullet);
    bullets.push(bullet);
}

// 更新子弹位置
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.position.add(bullet.velocity);
        
        // 检查子弹是否击中恐龙
        const distance = bullet.position.distanceTo(dinosaur.position);
        if (distance < 1.5) {
            dinosaurHealth -= attackPower;
            updateUI();
            scene.remove(bullet);
            bullets.splice(i, 1);
            
            // 恐龙受击停顿
            dinosaurCanMove = false;
            setTimeout(() => {
                dinosaurCanMove = true;
            }, 500); // 0.5秒停顿
            
            if (dinosaurHealth <= 0) {
                score += 100; // 击败恐龙获得100分
                alert('恭喜你击败了恐龙！获得100分！');
                resetGame();
            }
            continue;
        }
        
        // 移除超出范围的子弹
        if (bullet.position.length() > 50) {
            scene.remove(bullet);
            bullets.splice(i, 1);
        }
    }
}

// 恐龙移动
function moveDinosaur() {
    setInterval(() => {
        if (!dinosaurCanMove) return;
        
        const direction = new THREE.Vector3();
        direction.subVectors(player.position, dinosaur.position);
        direction.normalize();
        
        // 计算转向角度
        const angle = Math.atan2(direction.x, direction.z);
        dinosaur.rotation.y = angle;
        
        // 向前移动
        dinosaur.position.x += direction.x * dinosaurSpeed;
        dinosaur.position.z += direction.z * dinosaurSpeed;
        
        // 张嘴动画
        const lowerJaw = dinosaur.children.find(child => 
            child.position.y === 1.5 && child.position.z === 2.5);
        if(lowerJaw) {
            lowerJaw.position.y = 1.5 + Math.sin(Date.now() * 0.005) * 0.1;
        }
        
        // 检查是否接触到玩家
        const distance = dinosaur.position.distanceTo(player.position);
        if (distance < 2) {
            health = Math.max(0, health - 1);
            updateUI();
            if (health <= 0) {
                alert('游戏结束！');
                resetGame();
            }
        }
    }, 100);
}

// 更新相机
function updateCamera() {
    camera.position.x = player.position.x;
    camera.position.z = player.position.z + 10;
    camera.lookAt(player.position);
}

// 生成食物
function spawnFood() {
    const foodGeometry = new THREE.SphereGeometry(0.3);
    const foodMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const food = new THREE.Mesh(foodGeometry, foodMaterial);
    food.position.set(
        Math.random() * 40 - 20,
        0,
        Math.random() * 40 - 20
    );
    food.isFood = true;
    scene.add(food);
}

// 生成材料
function spawnMaterial() {
    const materialGeometry = new THREE.SphereGeometry(0.3);
    const materialMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const material = new THREE.Mesh(materialGeometry, materialMaterial);
    material.position.set(
        Math.random() * 40 - 20,
        0,
        Math.random() * 40 - 20
    );
    material.isMaterial = true;
    scene.add(material);
}

// 检查碰撞
function checkCollisions() {
    scene.children.forEach(object => {
        if (object.isFood || object.isMaterial) {
            const distance = player.position.distanceTo(object.position);
            if (distance < 1) {
                if (object.isFood) {
                    health = Math.min(maxHealth, health + 1);
                    updateUI();
                    scene.remove(object);
                } else if (object.isMaterial) {
                    attackPower++;
                    updateUI();
                    scene.remove(object);
                }
            }
        }
    });
}

// 更新UI
function updateUI() {
    try {
        document.getElementById('health').textContent = health;
        document.getElementById('maxHealth').textContent = maxHealth;
        document.getElementById('attack').textContent = attackPower;
        document.getElementById('monsterHealth').textContent = dinosaurHealth;
        document.getElementById('level').textContent = level;
        document.getElementById('score').textContent = score;
    } catch (error) {
        console.error('UI更新失败:', error);
    }
}

// 重置游戏
function resetGame() {
    health = 5;
    dinosaurHealth = 100;
    player.position.set(0, 0, 0);
    dinosaur.position.set(10, 0, 0);
    dinosaurCanMove = true; // 确保恐龙可以移动
    updateUI();
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    
    // 处理移动（添加边界检查）
    let newX = player.position.x;
    let newZ = player.position.z;
    
    if (keys.ArrowLeft) {
        newX -= moveSpeed;
    }
    if (keys.ArrowRight) {
        newX += moveSpeed;
    }
    if (keys.ArrowUp) {
        newZ -= moveSpeed;
    }
    if (keys.ArrowDown) {
        newZ += moveSpeed;
    }
    
    // 检查边界
    if (newX >= -groundLimit && newX <= groundLimit) {
        player.position.x = newX;
    }
    if (newZ >= -groundLimit && newZ <= groundLimit) {
        player.position.z = newZ;
    }
    
    // 处理射击
    if (keys[' ']) {
        shoot();
    }
    
    // 处理跳跃
    if ((keys.z || keys.Z) && !isJumping) {
        jump();
    }
    
    // 处理手雷投掷
    if ((keys.g || keys.G) && canThrowGrenade) {
        throwGrenade();
    }
    
    // 更新相机
    updateCamera();
    
    // 更新跳跃
    if (isJumping) {
        player.position.y += jumpVelocity;
        jumpVelocity -= gravity;
        
        if (player.position.y <= 0) {
            player.position.y = 0;
            isJumping = false;
            jumpVelocity = 0;
        }
    }
    
    // 更新手枪朝向
    updateGunDirection();
    
    // 更新手雷
    updateGrenades();
    
    updateBullets();
    checkCollisions();
    renderer.render(scene, camera);
}

// 确保在页面加载完成后再初始化
document.addEventListener('DOMContentLoaded', () => {
    try {
        init();
        console.log('游戏初始化成功');
    } catch (error) {
        console.error('游戏初始化失败:', error);
    }
});

// 窗口大小调整
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 商城控制
function toggleShop() {
    const shop = document.getElementById('shop');
    shop.style.display = shop.style.display === 'none' ? 'block' : 'none';
}

// 购买物品
function buyItem(itemType) {
    switch(itemType) {
        case 'health':
            if (score >= 50) {
                health = Math.min(health + 10, maxHealth);
                score -= 50;
                updateUI();
                alert('购买成功！生命值+10');
            } else {
                alert('分数不足！');
            }
            break;
        case 'attack':
            if (score >= 100) {
                attackPower += 2;
                score -= 100;
                updateUI();
                alert('购买成功！攻击力+2');
            } else {
                alert('分数不足！');
            }
            break;
        case 'maxHealth':
            if (score >= 200) {
                maxHealth += 10;
                health = Math.min(health + 10, maxHealth);
                score -= 200;
                updateUI();
                alert('购买成功！最大生命值+10');
            } else {
                alert('分数不足！');
            }
            break;
        case 'grenadeUpgrade':
            if (score >= 150) {
                grenadeDamage += 5;
                score -= 150;
                updateUI();
                alert('购买成功！手雷伤害+5');
            } else {
                alert('分数不足！');
            }
            break;
    }
}

// 修改跳跃功能
function jump() {
    if (!isJumping) {
        isJumping = true;
        jumpVelocity = 0.6;  // 原来是0.4，增加初始跳跃速度
    }
}

// 添加手枪朝向更新函数
function updateGunDirection() {
    // 获取右手臂和手枪（假设它们是玩家的子对象）
    const rightArm = player.children.find(child => child.position.x === 0.4); // 右手臂
    const gunGroup = rightArm.children[0]; // 手枪组

    // 计算玩家到恐龙的方向
    const direction = new THREE.Vector3();
    direction.subVectors(dinosaur.position, player.position).normalize();

    // 计算手枪应该旋转的角度
    const angle = Math.atan2(direction.x, direction.z);
    
    // 更新右手臂和手枪的旋转
    rightArm.rotation.y = angle;
    gunGroup.rotation.y = -angle; // 抵消手臂的旋转，保持手枪朝前

    // 稍微抬起手臂，使其看起来更自然
    rightArm.rotation.x = -0.2;
}

// 修改枪口闪光效果
function createMuzzleFlash(position) {
    const flashGeometry = new THREE.SphereGeometry(0.1);
    const flashMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 1
    });
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.copy(position);
    scene.add(flash);
    
    let opacity = 1;
    function fadeOut() {
        opacity -= 0.2;
        if (opacity <= 0) {
            scene.remove(flash);
            return;
        }
        flash.material.opacity = opacity;
        requestAnimationFrame(fadeOut);
    }
    fadeOut();
}

// 添加手雷投掷函数
function throwGrenade() {
    canThrowGrenade = false;
    
    // 创建手雷模型
    const grenadeGeometry = new THREE.SphereGeometry(0.15);
    const grenadeMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const grenade = new THREE.Mesh(grenadeGeometry, grenadeMaterial);
    
    // 设置手雷初始位置（从玩家手中投出）
    grenade.position.copy(player.position);
    grenade.position.y += 1;
    
    // 计算投掷方向（朝向恐龙）
    const direction = new THREE.Vector3();
    direction.subVectors(dinosaur.position, grenade.position).normalize();
    grenade.velocity = direction.multiplyScalar(grenadeSpeed);
    
    // 添加抛物线效果
    grenade.verticalVelocity = 0.3; // 初始向上速度
    
    scene.add(grenade);
    grenades.push(grenade);
    
    // 设置冷却时间
    setTimeout(() => {
        canThrowGrenade = true;
    }, grenadeCooldown);
}

// 添加手雷更新函数
function updateGrenades() {
    for (let i = grenades.length - 1; i >= 0; i--) {
        const grenade = grenades[i];
        
        // 更新位置（抛物线运动）
        grenade.position.add(grenade.velocity);
        grenade.position.y += grenade.verticalVelocity;
        grenade.verticalVelocity -= 0.015; // 重力效果
        
        // 检查是否击中地面
        if (grenade.position.y <= 0) {
            // 创建爆炸效果
            createExplosion(grenade.position);
            
            // 检查是否在爆炸范围内
            const distanceToDinosaur = grenade.position.distanceTo(dinosaur.position);
            if (distanceToDinosaur < 3) { // 爆炸范围3个单位
                dinosaurHealth -= grenadeDamage;
                updateUI();
                
                // 恐龙受击停顿
                dinosaurCanMove = false;
                setTimeout(() => {
                    dinosaurCanMove = true;
                }, 500);
                
                if (dinosaurHealth <= 0) {
                    alert('恭喜你击败了恐龙！');
                    resetGame();
                }
            }
            
            // 移除手雷
            scene.remove(grenade);
            grenades.splice(i, 1);
        }
    }
}

// 添加爆炸效果函数
function createExplosion(position) {
    // 爆炸光环
    const ringGeometry = new THREE.RingGeometry(0.1, 2, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xff8800,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(position);
    ring.position.y = 0.1;
    ring.rotation.x = -Math.PI / 2;
    scene.add(ring);
    
    // 爆炸动画
    let scale = 1;
    function animateExplosion() {
        if (scale >= 2) {
            scene.remove(ring);
            return;
        }
        scale += 0.1;
        ring.scale.set(scale, scale, scale);
        ring.material.opacity -= 0.05;
        requestAnimationFrame(animateExplosion);
    }
    animateExplosion();
} 